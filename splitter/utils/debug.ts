import { ASTNode } from 'parse5';

//
// for debug
//
export function formatNode(node: ASTNode): string {
    if (node.nodeName === '#text') {
        return node.value;
    }

    let str = `<${node.tagName}${node.attrs.map((attr) => {
        return ` ${attr.name}="${attr.value}"`;
    }).join('')}>`

    for (const child of node.childNodes) {
        str += formatNode(child);
    }

    str += `</${node.tagName}>`;

    return str;
}

export function formatStartTag(node: ASTNode): string {
    return `<${node.tagName} ${node.attrs.map((attr) => {
        return `${attr.name}="${attr.value}"`;
    }).join(' ')}>`
}
