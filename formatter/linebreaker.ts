'use strict'; // XXX
import { ASTNode } from 'parse5';
import { hasClassName } from '../splitter/utils/htmlutils';

const breakBeforeStartTag = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'body',
    'caption',
    'dd',
    'details',
    'dialog',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'legend',
    'li',
    'main',
    'map',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'table',
    'tbody',
    'td',
    'template',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
    'svg',
]);


const breakAfterStartTag: Set<string> = new Set([
    'blockquote',
    'dd',
    'dt',
    'li',
]);

const breakBeforeEndTag = new Set([
    'blockquote',
    'dd',
    'div',
    'dl',
    'dt',
    'li',
    'ol',
    'table',
    'tbody',
    'tfoot',
    'thead',
    'tr',
    'ul',
]);


export class LineBreaker {
    node: ASTNode
    nodeName: string
    depth: number
    didBreakAfterStartTag: boolean
    
    constructor(node: ASTNode, depth: number) {
        this.node = node;
        this.nodeName = node.nodeName;
        this.depth = (this.willBreakBeforeStartTag()) ? ++depth : depth;
        this.didBreakAfterStartTag = !this.willBreakAfterStartTag();
    }
    
    private breakAndIndent() {
        const buff: string[] = [];

        buff.push('\n');
        for (let i = 0; i < this.depth; i++) {
            buff.push(' ');
        }

        return buff.join('');
    }


    private willBreakBeforeStartTag() {
        if (hasClassName(this.node, 'div', 'impl')) {
            return false;
        }

        return breakBeforeStartTag.has(this.nodeName);
    }    
    
    breakBeforeStartTag() {
        if (this.willBreakBeforeStartTag()) {
            return this.breakAndIndent();
        }

        return '';
    }

    private willBreakAfterStartTag(): boolean {
        if (hasClassName(this.node, 'div', 'example') ||
            hasClassName(this.node, 'p', 'example') ||
            hasClassName(this.node, 'div', 'note') ||
            hasClassName(this.node, 'div', 'impl')) {
                return true;
        }

        return breakAfterStartTag.has(this.nodeName);
    }

    breakAfterStartTag(text: string) {
        // we did, do nothing
        if (this.didBreakAfterStartTag) {
            return '';
        }

        // skip white space
        if (text === ' ') {
            return '';
        }

        this.didBreakAfterStartTag = true;
        if (text.match(/^ *\n/)) {
            return '';
        }

        return this.breakAndIndent();
    }


    private willBreakBeforeEndTag() {
        if (hasClassName(this.node, 'div', 'impl')) {
            return false;
        }
        
        return breakBeforeEndTag.has(this.nodeName);
    }

    breakBeforeEndTag() {
        if (this.willBreakBeforeEndTag()) {
            return this.breakAndIndent();
        }

        return '';
    }
    
    unbreakBeforeEndTag(text) {
        if (this.nodeName === 'pre') {
            return text.replace(/\n *$/, '');
        }

        return text;
    }
}
