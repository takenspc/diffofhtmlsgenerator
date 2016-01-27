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
}

export interface Header {
    id: string
    nodes: ASTNode[]
    text: string
}

export interface Spec {
    header: Header
    chapters: Section[]
}


//
// Utils
//
export function fillText(doc: Document, spec: Spec): void {
    const header = spec.header;
    // console.log(header.id);
    header.text = getHTMLText(doc, header.nodes);

    for (const chapter of spec.chapters) {
        // console.log(chapter.heading);
        for (const section of chapter.sections) {
            // console.log('\t' + section.heading);
            section.text = getHTMLText(doc, section.nodes);
        }
    }
}

export function addSection(parent: Section, id: string, headingText: string, childNode: ASTNode): Section {
    // console.log(id);
    const section: Section = {
        id: id,
        heading: headingText,
        nodes: [childNode],
        sections: [],
        text: null
    };
    assert(parent, 'parent must be initialized before adding a section' + childNode.nodeName)
    parent.sections.push(section);
    return section;
}
