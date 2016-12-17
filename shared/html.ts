import { AST } from 'parse5';

export function getAttribute(node: AST.Default.Element, attrName: string): string {
    for (const attr of node.attrs) {
        if (attr.name === attrName) {
            return attr.value;
        }
    }

    return null;
}

export function hasClassName(node: AST.Default.Element, nodeName: string, className: string): boolean {
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


export function getText(node: AST.Default.Node): string {
    if (node.nodeName === '#text') {
        return (node as AST.Default.TextNode).value;
    }

    const childNodes = (node as AST.Default.Element).childNodes;
    if (childNodes) {
        let text = '';
        for (const child of childNodes) {
            text += getText(child);
        }
        return text;
    }

    return '';
}
