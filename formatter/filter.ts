'use strict'; // XXX
import { Attr, ASTNode } from 'parse5';
import { getAttribute, hasClassName } from '../splitter/htmlutils';
import { FormatContext } from './formatter';
import * as consts from './consts';

//
// Element
//
export function includeElement(node: ASTNode): boolean {
    if (hasClassName(node, 'a', 'self-link') ||
        hasClassName(node, 'div', 'status')) {
        return false;
    }

    return true;
}


//
// Tag
//
export function includeTag(context: FormatContext, node: ASTNode): boolean {
    if (hasClassName(node, 'div', 'impl') ||
        hasClassName(node, 'span', 'impl')) {
        return false;
    }


    const parent = context.parent;
    if (!parent) {
        return true;
    }

    if (hasClassName(parent, 'pre', 'highlight')) {
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
