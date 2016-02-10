'use strict'; // XXX
import * as assert from 'assert';
import { getText } from '../html';
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
    // check unknown keys
    const foundKeys = new Set(dl.keys());
    for (const key of keys) {
        foundKeys.delete(key);

        // XXX SKIP ARIA INFO
        if (key.startsWith('Allowed ARIA')) {
            continue;
        }
        
        if (dl.has(key)) {
            reordered = reordered.concat(dl.get(key));
        }
    }
    assert(foundKeys.size === 0, 'There are unknown dt in dl.element: ' + foundKeys);

    return reordered;
}

export function containsOnlyARIAInfo(node: ASTNode): boolean {
    let dl: ASTNode = null;

    for (const childNode of node.childNodes) {
        if (childNode.nodeName === '#text') {
            continue;
        }
        
        if (childNode.nodeName !== 'dl') {
            return false;
        }

        dl = childNode;
        break;
    }

    for (const childNode of dl.childNodes) {
        if (childNode.nodeName === 'dt') {
            const key = getText(childNode).trim();
            if (!key.startsWith('Allowed ARIA')) {
                return false;
            }
        }
    }

    return true;
}
