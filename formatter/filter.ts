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
const noisyAttributes = new Set([
    'id',
    'role',
]);

const noisyClasses = new Set([
    'idl',
    'idl-code',
    'heading settled',
]);
export function includeAttr(attr: Attr): boolean {
    const name = attr.name;
    if (name.startsWith('data-')) {
        return false;
    }

    if (noisyAttributes.has(name)) {
        return false;
    }

    if (name === 'class' && noisyClasses.has(attr.value)) {
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
