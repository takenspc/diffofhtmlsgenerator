'use strict'; // XXX
import { Attr, ASTNode } from 'parse5';
import { getAttribute, hasClassName } from '../splitter/htmlutils';
import * as consts from './consts';

//
// Context
//
class FilterContext {
    parentStack: ASTNode[] = []
    
    get parent(): ASTNode {
        const length = this.parentStack.length;
        if (length === 0) {
            return null;
        }
        return this.parentStack[length - 1];
    }
    
    push(parent: ASTNode) {
        this.parentStack.push(parent);
    }
    
    pop() {
        this.parentStack.pop();
    }
}


//
// Attr
//
function includeAttr(attr: Attr): boolean {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith('data-')) {
        return false;
    }

    if (consts.excludeAttrs.has(name)) {
        return false;
    }

    if (name === 'class' && consts.excludeClassNames.has(value)) {
        return false;
    }

    return true;
}

function filterAttrs(context: FilterContext, node: ASTNode): void {
    node.attrs = node.attrs.filter(includeAttr);
}


//
// Element
//
function includeElement(context: FilterContext, node: ASTNode): boolean {
    if (hasClassName(node, 'a', 'self-link') ||
        hasClassName(node, 'div', 'status')) {
        return false;
    }
    
    // TODO splitter shouldn't include <div class='impl'>
    if (hasClassName(node, 'div', 'impl')) {
        for (const childNode of node.childNodes) {
            if (!childNode.nodeName.startsWith('#')) {
                return true;
            }
        }
        return false;
    }

    return true;
}

function flattenElement(context: FilterContext, node: ASTNode): boolean {
    const nodeName = node.nodeName;
    
    if (consts.textLevelElements.has(nodeName)) {
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


function* nextElement(context: FilterContext, node: ASTNode): Iterable<ASTNode> {
    for (const childNode of node.childNodes) {
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
function filterNode(context: FilterContext, node: ASTNode): void {
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

export function filter(node: ASTNode): ASTNode  {
    const context: FilterContext = new FilterContext();

    filterNode(context, node);

    return node;
}
