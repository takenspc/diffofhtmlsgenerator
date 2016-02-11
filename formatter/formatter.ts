'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { getText, hasClassName } from '../html';
import { LineBreaker } from './linebreaker';
import * as consts from './consts';
import { BufferList } from './';

//
// Context
//
class FormatContext {
    parentStack: ASTNode[] = []
    bufferList: BufferList
    
    constructor(bufferList: BufferList) {
        this.bufferList = bufferList;
    }
    
    get parent(): ASTNode {
        const length = this.parentStack.length;
        if (length === 0) {
            return null;
        }
        return this.parentStack[length - 1];
    }
    
    push(parent: ASTNode) {
        this.parentStack.push(parent);
    }
    
    pop() {
        this.parentStack.pop();
    }
}


//
// Utils
//
function escapeHTML(text: string): string {
    let escaped = text;
    escaped = escaped.replace(/&/g, '&amp;');
    escaped = escaped.replace(/>/g, '&gt;');
    escaped = escaped.replace(/</g, '&lt;');
    return escaped;
}


//
// Attr
//
function escapeAttrValue(text: string): string {
    let escaped = text;
    escaped = escapeHTML(escaped);
    escaped = escaped.replace(/"/g, '&quot;');
    return escaped;
}

function sortAttr(a: Attr, b: Attr): number {
    if (a.name < b.name) {
        return -1;
    }

    if (a.name > b.name) {
        return 1;
    }

    return 0;
}


//
// Tag
//
function formatStartTag(context: FormatContext, node: ASTNode): string {
    const buff: string[] = []

    buff.push('<');
    buff.push(node.nodeName);

    if (node.attrs.length > 0) {
        const attrs = node.attrs.sort(sortAttr);

        buff.push(attrs.map((attr) => {
            return ` ${attr.name}="${escapeAttrValue(attr.value)}"`;
        }).join(''));
    }

    buff.push('>');

    return buff.join('');
}

function formatEndTag(context: FormatContext, node: ASTNode): string {
    const buff: string[] = [];

    buff.push('</');
    buff.push(node.nodeName);
    buff.push('>');

    return buff.join('');
}


//
// Node
//
function formatText(context: FormatContext, node: ASTNode): void {
    let value = node.value;

    if (!context.parent || context.parent.nodeName !== 'pre') {
        value = value.replace(/\s+/g, ' ');
    }

    return context.bufferList.write(escapeHTML(value));
}


function formatElement(context: FormatContext, node: ASTNode, depth: number): void {
    // const buff: string[] = [];

    const createContext = consts.contextElements.has(node.nodeName);
    if (createContext) {
        context.push(node);
    }

    const lineBreaker = new LineBreaker(node, depth);

    context.bufferList.write(lineBreaker.breakBeforeStartTag());
    context.bufferList.write(formatStartTag(context, node));

    const isElementInfo = hasClassName(node, 'dl', 'element');

    const newDepth = lineBreaker.depth;
    const childNodes = node.childNodes;    
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];

        // create new buffer after 'DOM interface:'
        if (isElementInfo && childNode.nodeName === 'dt' && getText(childNode).trim() === 'DOM interface:') {
            context.bufferList.createNextBuffer();
        }

        // insert line break after start tag
        context.bufferList.write(lineBreaker.breakAfterStartTag(childNode));
        format(context, childNode, newDepth);

        if (i === childNodes.length - 1) {
            const buffer = context.bufferList.buffer;
            lineBreaker.unbreakBeforeEndTag(buffer);
        }
    }

    if (!consts.voidElements.has(node.nodeName)) {
        context.bufferList.write(lineBreaker.breakBeforeEndTag());
        context.bufferList.write(formatEndTag(context, node));
    }

    if (createContext) {
        context.pop();
    }
}


//
// Tree
//
function format(context: FormatContext, node: ASTNode, depth: number): void {
    if (node.nodeName === '#text') {
        formatText(context, node);
    } else {
        formatElement(context, node, depth);
    }
}

export function formatFragment(bufferList: BufferList, node: ASTNode): void {
    const context: FormatContext = new FormatContext(bufferList);

    for (const childNode of node.childNodes) {
        format(context, childNode, -1);
    }
    
    bufferList.flush();
}
