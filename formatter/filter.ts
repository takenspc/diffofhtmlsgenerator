'use strict'; // XXX
import { Attr, ASTNode } from 'parse5';
import { getAttribute } from '../splitter/htmlutils';
import { FormatContext } from './formatter';
import * as consts from './consts';

//
// Element
//
export function includeElement(node: ASTNode): boolean {
    if ((node.nodeName === 'a' && getAttribute(node, 'class') === 'self-link') ||
        (node.nodeName === 'div' && getAttribute(node, 'class') === 'status')) {
        return false;
    }

    return true;
}


//
// Tag
//
export function includeTag(context: FormatContext, node: ASTNode): boolean {
    const parent = context.parent;
    if (!parent) {
        return true;
    }

    if (parent.nodeName === 'pre' && getAttribute(parent, 'class') === 'highlight') {
        const className = getAttribute(node, 'class');
        return !consts.BikeshedHighlightClassNames.has(className)
    }

    if (consts.HeadingContent.has(parent.nodeName)) {
        const className = getAttribute(node, 'class');
        return !consts.BikeshedHeadingClassNames.has(className)
    }

    return true;
}


//
// Attr
//
export function includeAttr(attr: Attr): boolean {
    if (attr.name.startsWith('data-') ||
        attr.name === 'id' ||
        attr.name === 'role') {
        return false;
    }
    return true;
}

export function modifyAttr(attr: Attr): Attr {
    if (attr.name === 'href') {
        attr.value = '#';
    }

    return attr;
}

export function sortAttr(a: Attr, b: Attr): number {
    if (a.name < b.name) {
        return -1;
    }

    if (a.name > b.name) {
        return 1;
    }
    return 0;
}
