'use strict';
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getAttribute, getText, getHTMLText } from './htmlutils';

//
// Interfaces
//
export interface Section {
    id: string
    heading: string
    nodes: ASTNode[]
    text: string
    sections: Section[]
    path: string
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
// Utils
//
function ntfsSafe(value: string): string {
    // https://support.microsoft.com/kb/100108
    const ntfsUnsafe = /[?"/\<>*|:]/g;
    return value.replace(ntfsUnsafe, '_');
}


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

export function addChildNode(parent: Section, current: Section, childNode: ASTNode): Section {
    if (!current) {
        if ((childNode.nodeName === '#text' && childNode.value.trim() === '')) {
            return current;
        }

        const id = '__pre__';
        const headingText = '__pre__';
        return addSection(parent, id, headingText, childNode);
    }

    current.nodes.push(childNode);
    return current;
}

export function addSection(parent: Section, id: string, headingText: string, childNode: ASTNode): Section {
    // console.log(id);
    assert(parent, 'parent must be initialized before adding a section' + childNode.nodeName)

    const path = (parent.path !== '') ? parent.path + '/' + ntfsSafe(headingText) : ntfsSafe(headingText);

    const section: Section = {
        id: id,
        heading: headingText,
        nodes: [childNode],
        sections: [],
        text: null,
        path: path,
    };
    
    parent.sections.push(section);
    return section;
}
