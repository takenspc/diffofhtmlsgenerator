'use strict'; // XXX
import * as fs from 'fs';
import * as parse5 from 'parse5';

//
// Parse
//
export interface Document {
    node: parse5.ASTNode
    text: string
}

export function parse(htmlPath): Promise<Document> {
    return new Promise((resolve, reject) => {
        fs.readFile(htmlPath, 'utf-8', (err, text) => {
            if (err) {
                reject(err);
                return;
            }

            const node = parse5.parse(text, {
                locationInfo: true,
            });
            const doc: Document = {
                node: node,
                text: text
            };
            resolve(doc);
        });
    });
}


//
// Utils
//
export function getBody(doc: Document): parse5.ASTNode {
    for (const html of doc.node.childNodes) {
        if (html.nodeName !== 'html') {
            continue;
        }

        for (const body of html.childNodes) {
            if (body.nodeName === 'body') {
                return body;
            }
        }
    }
    
    return null;
}

export function getAttribute(node: parse5.ASTNode, attrName: string): string {
    for (const attr of node.attrs) {
        if (attr.name === attrName) {
            return attr.value;
        }
    }

    return null;
}

export function hasClassName(node: parse5.ASTNode, nodeName: string, className: string): boolean {
    if (node.nodeName !== nodeName) {
        return false;
    }
    
    let value = getAttribute(node, 'class');
    if (!value) {
        return false;
    }
    
    value = ' ' + value.replace(/\s+/g, ' ').trim() + ' ';
    return value.indexOf(' ' + className + ' ') !== -1;
}


export function getText(node: parse5.ASTNode): string {
    if (node.nodeName === '#text') {
        return node.value;
    }

    if (node.childNodes) {
        let text = '';
        for (const child of node.childNodes) {
            text += getText(child);
        }
        return text;
    }

    return '';
}

export function getHTMLText(doc: Document, nodes: parse5.ASTNode[]): string {
    const start = nodes[0].__location.startOffset;
    const end = nodes[nodes.length - 1].__location.endOffset;
    return doc.text.substring(start, end);
}
