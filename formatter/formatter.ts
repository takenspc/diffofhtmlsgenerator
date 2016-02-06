'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { LineBreaker } from './linebreaker';
import * as consts from './consts';

//
// Context
//
class FormatContext {
    parentStack: ASTNode[] = []
    
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
function formatText(context: FormatContext, node: ASTNode): string {
    let value = node.value;

    if (!context.parent || context.parent.nodeName !== 'pre') {
        value = value.replace(/\s+/g, ' ');
    }

    return escapeHTML(value)
}


function formatElement(context: FormatContext, node: ASTNode, depth: number): string {
    const buff: string[] = [];

    const createContext = consts.contextElements.has(node.nodeName);
    if (createContext) {
        context.push(node);
    }

    const lineBreaker = new LineBreaker(node, depth);

    buff.push(lineBreaker.breakBeforeStartTag());
    buff.push(formatStartTag(context, node));

    const newDepth = lineBreaker.depth;
    const childNodes = node.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        const text = format(context, childNode, newDepth);

        buff.push(lineBreaker.breakAfterStartTag(text));

        if (i === childNodes.length - 1) {
            buff.push(lineBreaker.unbreakBeforeEndTag(text));
        } else {
            buff.push(text);
        }
    }

    if (!consts.voidElements.has(node.nodeName)) {
        buff.push(lineBreaker.breakBeforeEndTag());
        buff.push(formatEndTag(context, node));
    }

    if (createContext) {
        context.pop();
    }

    return buff.join('');
}


//
// Tree
//
function format(context: FormatContext, node: ASTNode, depth: number): string {
    if (node.nodeName === '#text') {
        return formatText(context, node);
    }

    return formatElement(context, node, depth);
}

export function formatFragment(node: ASTNode): string {
    const buff: string[] = []

    const context: FormatContext = new FormatContext();

    for (const childNode of node.childNodes) {
        buff.push(format(context, childNode, -1));
    }

    return buff.join('');
}
