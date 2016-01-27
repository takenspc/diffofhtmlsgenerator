'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { includeElement, includeTag, includeAttr, modifyAttr, sortAttr } from './filter';
import * as consts from './consts';

//
// Context
//
export class FormatContext {
    parentStack: ASTNode[]
    
    constructor() {
        this.parentStack = [];
    }
    
    get parent(): ASTNode {
        const length = this.parentStack.length;
        if (length === 0) {
            null;
        }
        
        return this.parentStack[length - 1];
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
    escaped = escaped.replace(/"/g, '&quot;');
    return escaped;
}


//
// Tag
//
function formatStartTag(context:FormatContext, node: ASTNode): string {
    const buff: string[] = []
    buff.push('<');
    buff.push(node.nodeName);

    if (node.attrs.length > 0) {
        const attrs = node.attrs.filter(includeAttr).map(modifyAttr).sort(sortAttr);
        buff.push(attrs.map((attr) => {
            return ' ' + attr.name + '="' + escapeHTML(attr.value) + '"';
        }).join(''));
    }

    buff.push('>');
    if (consts.BreakAfterStartTag.has(node.nodeName)) {
        buff.push('\n');
    }

    return buff.join('');
}

function formatEndTag(context:FormatContext, node: ASTNode): string {
    const buff: string[] = [];

    buff.push('</');

    buff.push(node.nodeName);

    buff.push('>');
    if (consts.BreakAfterEndTag.has(node.nodeName)) {
        if (node.nodeName === 'p' &&
            (context.parent && context.parent.nodeName === 'dt')) {
            // NO OP
        } else {
            buff.push('\n');
        }
    }

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

function formatElement(context: FormatContext, node: ASTNode): string {
    if (!includeElement(node)) {
        return '';
    }

    const buff: string[] = [];
    
    if (includeTag(context, node)) {
        buff.push(formatStartTag(context, node));
    }

    if (consts.ContextElements.has(node.nodeName)) {
        context.parentStack.push(node);
    }

    for (const childNode of node.childNodes) {
        buff.push(format(context, childNode));
    }

    if (consts.ContextElements.has(node.nodeName)) {
        context.parentStack.pop();
    }

    if (!consts.VoidElements.has(node.nodeName) && includeTag(context, node)) {
        buff.push(formatEndTag(context, node));
    }

    return buff.join('');
}


//
// Tree
//
export function format(context: FormatContext, node: ASTNode): string {
    if (node.nodeName === '#text') {
        return formatText(context, node);
    }

    return formatElement(context, node);
}

export function formatFragment(node: ASTNode): string {
    const buff: string[] = []

    const context: FormatContext = new FormatContext();

    for (const childNode of node.childNodes) {
        buff.push(format(context, childNode));
    }

    return buff.join('');
}
