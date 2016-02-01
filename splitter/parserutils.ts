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
export function addChildNode(parent: Section, current: Section, childNode: ASTNode): Section {
    if (!current) {
        if ((childNode.nodeName === '#text' && childNode.value.trim() === '') ||
            hasClassName(childNode, 'div', 'status')) {
            return current;
        }

        const id = '__pre__';
        const headingText = '(preface)';
        const originalHeadingText = '(preface)';
        return addSection(parent, id, headingText, originalHeadingText, childNode);
    }

    current.nodes.push(childNode);
    return current;
}

// Utils
function ntfsSafe(value: string): string {
    // https://support.microsoft.com/kb/100108
    const ntfsUnsafe = /[?"/\<>*|:]/g;
    return value.replace(ntfsUnsafe, '_');
}

function replaceHeadingText(original: string): string {
    let headingText = original;

    // Common infrastructure → Terminology → Plugins
    headingText = headingText.replace('Plugin Content Handlers', 'Plugins');

    // Common infrastructure → Common microsyntaxes → Colours
    headingText = headingText.replace('Colors', 'Colours');
    
    // The HTML syntax
    // The XHTML syntax
    headingText = headingText.replace('Serializing', 'Serialising');
    return headingText;
}


export function addSection(parent: Section, id: string, headingText: string, originalHeadingText: string, childNode: ASTNode): Section {
    assert(parent, 'parent must be initialized before adding a section' + childNode.nodeName)

    const path = (parent.path !== '') ? parent.path + '/' + ntfsSafe(headingText) : ntfsSafe(headingText);

    const section: Section = {
        id: id,

        path: path,
        headingText: replaceHeadingText(headingText),
        originalHeadingText: originalHeadingText,

        nodes: [childNode],
        text: null,

        sections: [],
    };
    
    parent.sections.push(section);
    return section;
}
