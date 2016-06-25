import { ASTNode } from 'parse5';

export function getAttribute(node: ASTNode, attrName: string): string {
    for (const attr of node.attrs) {
        if (attr.name === attrName) {
            return attr.value;
        }
    }

    return null;
}

export function hasClassName(node: ASTNode, nodeName: string, className: string): boolean {
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


export function getText(node: ASTNode): string {
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
