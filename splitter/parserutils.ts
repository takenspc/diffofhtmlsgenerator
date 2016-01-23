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
}

export interface Chapter {
    id: string
    heading: string
    node: ASTNode
    sections: Section[]
}

export interface Header {
    id: string
    nodes: ASTNode[]
    text: string
}

export interface Spec {
    header: Header
    chapters: Chapter[]
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

export function addChapter(chapters: Chapter[], id: string, headingText: string, childNode: ASTNode): Chapter {
    // console.log(id);
    const chapter = {
        id: id,
        heading: headingText,
        node: childNode,
        sections: []
    };
    chapters.push(chapter);
    return chapter;
}

export function addSection(chapter: Chapter, id: string, headingText: string, childNode: ASTNode): Section {
    // console.log('\t' + id);
    const section = {
        id: id,
        heading: headingText,
        nodes: [childNode],
        text: null
    }

    assert(chapter, 'chapter must be initialized before adding a section' + childNode.nodeName)
    chapter.sections.push(section);

    return section;
}
