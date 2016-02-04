'use strict';
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getAttribute, hasClassName, getText, getHTMLText } from './htmlutils';

//
// Interfaces
//
export interface Section {
    id: string

    path: string
    headingText: string
    originalHeadingText: string

    nodes: ASTNode[]
    text: string

    sections: Section[]
}

export interface Header {
    id: string
    nodes: ASTNode[]
    text: string
}

export interface Spec {
    header: Header
    section: Section 
}


//
// fill text
//
export function fillText(doc: Document, spec: Spec): void {
    const header = spec.header;
    // console.log(header.id);
    header.text = getHTMLText(doc, header.nodes);

    fillTextInternal(doc, spec.section);
}

function fillTextInternal(doc: Document, section: Section) {
    // console.log(section.heading);

    if (section.sections.length === 0) {
        section.text = getHTMLText(doc, section.nodes);
        return;
    }

    for (const subSection of section.sections) {
        fillTextInternal(doc, subSection);
    }
}


//
//
//
function formatStartTag(node: ASTNode) {
    return `<${node.tagName} ${node.attrs.map((attr) => {
        return `${attr.name}="${attr.value}"`;
    }).join(' ')}>`
}

export function addChildNode(parent: Section, current: Section, childNode: ASTNode): Section {
    // adding preface contents
    if (!current) {
        if ((childNode.nodeName === '#text' && childNode.value.trim() === '') ||
            hasClassName(childNode, 'div', 'status')) {
            return current;
        }

        assert(parent, '__pre__ must have a parent:' + formatStartTag(childNode));
        const id = '__pre__';
        const headingText = '__pre__';
        const originalHeadingText = '__pre__';
        return addSection(parent, id, headingText, originalHeadingText, childNode);
    }

    // normal
    current.nodes.push(childNode);
    return current;
}


//
//
//
function normalizeHeadingText(original: string): string {
    let headingText = original;

    // ’ → '
    headingText = headingText.replace('’', '\'');

    // Common infrastructure → Terminology → Plugins
    headingText = headingText.replace('Plugin Content Handlers', 'Plugins');

    // Common infrastructure → Common microsyntaxes → Colours
    headingText = headingText.replace('Colors', 'Colours');

    // The HTML syntax
    // The XHTML syntax
    headingText = headingText.replace('Serializing', 'Serialising');
    return headingText;
}

function ntfsSafe(value: string): string {
    // https://support.microsoft.com/kb/100108
    const ntfsUnsafe = /[?"/\<>*|:]/g;
    return value.replace(ntfsUnsafe, '_');
}

export function addSection(parent: Section, id: string, headingText: string, originalHeadingText: string, childNode: ASTNode): Section {
    let normalizedHeadingText = normalizeHeadingText(headingText);

    // path is not for human, for system
    const path = (parent) ? parent.path + '/' + ntfsSafe(normalizedHeadingText) : ntfsSafe(normalizedHeadingText);

    // preface
    if (id === '__pre__') {
        id = parent.id;
        normalizedHeadingText = '(preface)';
        originalHeadingText = `(preface of ${parent.originalHeadingText})`;
    }

    const section: Section = {
        id: id,

        path: path,
        headingText: normalizedHeadingText,
        originalHeadingText: originalHeadingText,

        nodes: [childNode],
        text: null,

        sections: [],
    };
    
    if (parent) {
        parent.sections.push(section);
    }
    return section;
}
