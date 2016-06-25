import { ASTNode } from 'parse5';
import { hasClassName } from '../html';
import { BufferList } from './';

const breakBeforeStartTag: Set<string> = new Set([
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
    // 'section',
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

const breakBeforeEndTag: Set<string> = new Set([
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
    private node: ASTNode
    private nodeName: string
    depth: number
    private didBreakAfterStartTag: boolean
    
    constructor(node: ASTNode, depth: number) {
        this.node = node;
        this.nodeName = node.nodeName;
        this.depth = (this.willBreakBeforeStartTag(node)) ? ++depth : depth;
        this.didBreakAfterStartTag = !this.willBreakAfterStartTag();
    }
    
    private breakAndIndent(): string {
        const buff: string[] = [];

        buff.push('\n');
        for (let i = 0; i < this.depth; i++) {
            buff.push(' ');
        }

        return buff.join('');
    }


    private willBreakBeforeStartTag(node: ASTNode): boolean {
        if (hasClassName(node, 'div', 'impl')) {
            return false;
        }

        return breakBeforeStartTag.has(node.nodeName);
    }    
    
    breakBeforeStartTag(): string {
        if (this.willBreakBeforeStartTag(this.node)) {
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

    breakAfterStartTag(node: ASTNode): string {
        // we did, do nothing
        if (this.didBreakAfterStartTag) {
            return '';
        }

        // skip white space text nodes
        if (node.nodeName === '#text' && node.value.trim() === '') {
            return '';
        }

        this.didBreakAfterStartTag = true;
        // if the start tag of a node inserts a line break, do nothing
        if (this.willBreakBeforeStartTag(node)) {
            return '';
        }

        return this.breakAndIndent();
    }


    private willBreakBeforeEndTag(): boolean {
        if (hasClassName(this.node, 'div', 'impl')) {
            return false;
        }
        
        return breakBeforeEndTag.has(this.nodeName);
    }

    breakBeforeEndTag(): string {
        if (this.willBreakBeforeEndTag()) {
            return this.breakAndIndent();
        }

        return '';
    }
    
    unbreakBeforeEndTag(buffer: string[]): void {
        if (this.nodeName === 'pre') {
            const index = buffer.length - 1;
            buffer[index] = buffer[index].replace(/\n *$/, '');
        }
    }
}
