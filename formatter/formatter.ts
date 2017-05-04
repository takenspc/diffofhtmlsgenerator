import * as assert from 'assert';
import { AST } from 'parse5';
import { getText, hasClassName } from '../shared/html';
import * as consts from './consts';
import { LineBreaker } from './linebreaker';

//
// Context
//
class FormatContext {
    private parentStack: AST.Default.Node[] = [];
    private buffers: string[][] = [];

    constructor() {
        this.createNextBuffer();
    }

    get buffer(): string[] {
        return this.buffers[this.buffers.length - 1];
    }

    getHTMLs(): string[] {
        return this.buffers.map((texts) => {
            return texts.join('');
        });
    }

    createNextBuffer(): void {
        this.buffers.push([]);
    }

    write(text: string): void {
        this.buffer.push(text);
    }

    get parent(): AST.Default.Node {
        const length = this.parentStack.length;
        if (length === 0) {
            return null;
        }
        return this.parentStack[length - 1];
    }

    push(parent: AST.Default.Node): void {
        this.parentStack.push(parent);
    }

    pop(): void {
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
function formatStartTag(context: FormatContext, node: AST.Default.Element): string {
    const buff: string[] = [];

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

function formatEndTag(context: FormatContext, node: AST.Default.Element): string {
    const buff: string[] = [];

    buff.push('</');
    buff.push(node.nodeName);
    buff.push('>');

    return buff.join('');
}

//
// Node
//
function formatText(context: FormatContext, node: AST.Default.TextNode): void {
    let value = node.value;

    if (!context.parent || context.parent.nodeName !== 'pre') {
        value = value.replace(/\s+/g, ' ');
    }

    return context.write(escapeHTML(value));
}

function formatElement(context: FormatContext, node: AST.Default.Element, depth: number): void {
    // const buff: string[] = [];

    const createContext = consts.contextElements.has(node.nodeName);
    if (createContext) {
        context.push(node);
    }

    const lineBreaker = new LineBreaker(node, depth);

    context.write(lineBreaker.breakBeforeStartTag());
    context.write(formatStartTag(context, node));

    const isElementInfo = hasClassName(node, 'dl', 'element');

    const newDepth = lineBreaker.depth;
    const childNodes = node.childNodes as AST.Default.Element[];
    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];

        // create new buffer after 'DOM interface:'
        if (isElementInfo && childNode.nodeName === 'dt' && getText(childNode).trim() === 'DOM interface:') {
            context.createNextBuffer();
        }

        // insert line break after start tag
        context.write(lineBreaker.breakAfterStartTag(childNode));
        format(context, childNode, newDepth);

        if (i === childNodes.length - 1) {
            const buffer = context.buffer;
            lineBreaker.unbreakBeforeEndTag(buffer);
        }
    }

    if (!consts.voidElements.has(node.nodeName)) {
        context.write(lineBreaker.breakBeforeEndTag());
        context.write(formatEndTag(context, node));
    }

    if (createContext) {
        context.pop();
    }
}

//
// Tree
//
function format(context: FormatContext, node: AST.Default.Element | AST.Default.TextNode, depth: number): void {
    if (node.nodeName === '#text') {
        formatText(context, node as AST.Default.TextNode);
    } else {
        formatElement(context, node as AST.Default.Element, depth);
    }
}

export function formatFragment(node: AST.Default.DocumentFragment): string[] {
    const context: FormatContext = new FormatContext();

    for (const childNode of node.childNodes as AST.Default.Element[]) {
        format(context, childNode, -1);
    }

    return context.getHTMLs();
}
