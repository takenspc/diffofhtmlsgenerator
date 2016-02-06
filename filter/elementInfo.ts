'use strict'; // XXX
import { getText } from '../splitter/htmlutils';
import { ASTNode } from 'parse5';

const keys: string[] = [
    '__pre__',

    'Categories:',

    'Contexts in which this element can be used:',

    'Content model:',

    'Tag omission in text/html:',
    'Tag omission in text/html',

    'Content attributes:',

    'Allowed ARIA role attribute values:',
    'Allowed ARIA state and property attributes:',

    'DOM interface:',
]


export function reorder(childNodes: ASTNode[]) {
    const dl = new Map<string, ASTNode[]>();

    let nodes = [];
    dl.set('__pre__', nodes);

    // childNodes => dl.element > *
    for (const childNode of childNodes) {
        if (childNode.nodeName === 'dt') {
            const key = getText(childNode).trim();
            nodes = [];
            dl.set(key, nodes);
        }

        nodes.push(childNode);
    }

    let reordered = [];
    for (const key of keys) {
        if (dl.has(key)) {
            reordered = reordered.concat(dl.get(key));
        }
    }

    return reordered;
}

