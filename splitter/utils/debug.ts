import { AST } from 'parse5';

//
// for debug
//
export function formatNode(node: AST.Default.Node): string {
    if (node.nodeName === '#text') {
        return (node as AST.Default.TextNode).value;
    }

    const nodeAsElement = node as AST.Default.Element;
    let str = formatStartTag(nodeAsElement);

    for (const child of nodeAsElement.childNodes) {
        str += formatNode(child);
    }

    str += `</${nodeAsElement.tagName}>`;

    return str;
}

export function formatStartTag(node: AST.Default.Element): string {
    return `<${node.tagName} ${node.attrs.map((attr) => {
        return `${attr.name}="${attr.value}"`;
    }).join(' ')}>`;
}
