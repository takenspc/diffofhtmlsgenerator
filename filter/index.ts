import { AST } from 'parse5';
import { getAttribute, hasClassName } from '../shared/html';
import * as consts from './consts';

//
// Context
//
class FilterContext {
    private parentStack: AST.Default.Node[] = [];

    get parent(): AST.Default.Node {
        const length = this.parentStack.length;
        if (length === 0) {
            return null;
        }
        return this.parentStack[length - 1];
    }

    push(parent: AST.Default.Node): void {
        this.parentStack.push(parent);
    }

    pop(): void {
        this.parentStack.pop();
    }
}

//
// Attr
//
function includeAttr(attr: AST.Default.Attribute): boolean {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith('data-')) {
        return false;
    }

    if (consts.excludeAttrs.has(name)) {
        return false;
    }

    if (name === 'class' && value === '') {
        return false;
    }

    return true;
}

function filterAttrValue(attr: AST.Default.Attribute): void {
    if (attr.name === 'class') {
        let values = attr.value.trim().replace(/\s+/g, ' ').split(' ');
        values = values.filter((value) => {
            return !consts.excludeClassNames.has(value);
        });
        attr.value = values.join(' ');
    }
}

function filterAttrs(context: FilterContext, node: AST.Default.Element): void {
    const newAttrs: AST.Default.Attribute[] = [];

    for (const attr of node.attrs) {
        filterAttrValue(attr);

        if (includeAttr(attr)) {
            newAttrs.push(attr);
        }
    }

    node.attrs = newAttrs;
}

//
// Element
//
function includeElement(context: FilterContext, node: AST.Default.Element): boolean {
    if (hasClassName(node, 'a', 'self-link') ||
        hasClassName(node, 'span', 'dfn-panel') ||
        hasClassName(node, 'div', 'status')) {
        return false;
    }

    // XXX <span>
    if (node.nodeName === 'span') {
        if (node.childNodes.length === 0) {
            return false;
        }
    }

    return true;
}

function flattenElement(context: FilterContext, node: AST.Default.Element): boolean {
    const nodeName = node.nodeName;

    if (consts.textLevelElements.has(nodeName)) {
        return true;
    }

    // XXX Structure of this specification
    if (node.nodeName === 'div' && node.attrs.length === 0) {
        return true;
    }

    const parent = context.parent;
    if (parent) {
        const parentNodeName = parent.nodeName;
        const className = getAttribute(node, 'class');

        if (parentNodeName === 'pre' &&
            consts.pygmentsClassNames.has(className)) {
            return true;
        }

        if (consts.headingElements.has(parentNodeName) &&
            consts.headingClassNames.has(className)) {
            return true;
        }
    }

    return false;
}

function* nextElement(context: FilterContext, node: AST.Default.Element): Iterable<AST.Default.Element> {
    for (const childNode of (node.childNodes as AST.Default.Element[])) {
        // if childNode is a non element
        if (childNode.nodeName.startsWith('#')) {
            yield childNode;
        } else {
            if (flattenElement(context, childNode)) {
                yield* nextElement(context, childNode);
            } else if (includeElement(context, childNode)) {
                yield childNode;
            }
        }
    }
}

//
// Tree
//
function filterNode(context: FilterContext, node: AST.Default.Element): void {
    const createContext = consts.contextElements.has(node.nodeName);
    if (createContext) {
        context.push(node);
    }

    if (node.attrs) {
        filterAttrs(context, node);
    }

    if (node.childNodes) {
        const newChildNodes = [];
        for (const childNode of nextElement(context, node)) {
            newChildNodes.push(childNode);
            filterNode(context, childNode);
        }

        node.childNodes = newChildNodes;
    }

    if (createContext) {
        context.pop();
    }
}

/**
 * @param {AST.Default.DocumentFragment | AST.Default.Element} node node must be DocumentFragment
 * @returns {AST.Default.DocumentFragment}
 */
export function filter(node: AST.Default.DocumentFragment | AST.Default.Element): AST.Default.DocumentFragment {
    const context: FilterContext = new FilterContext();

    filterNode(context, node as AST.Default.Element);

    return node as AST.Default.DocumentFragment;
}
