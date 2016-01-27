'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getBody, getAttribute, getText } from './htmlutils';
import { Spec, Header, Section, addSection, fillText } from './parserutils';

function getHeadingText(node: ASTNode) {
    const text = getText(node);
    return text.replace(/^\d+(?:\.\d+)? /, '');
}

//
// Entry Point
//
export function parseSpec(doc: Document): Spec {
    const root: Section = {
        id: '#root#',
        heading: '#root#',
        nodes: [],
        text: null,
        sections: [],
    };

    let header: Header;

    const body = getBody(doc);

    let isHeader = true;
    let inMain = false;

    let chapter: Section = null;
    let section: Section = null;
    let subSection: Section = null;
    for (const childNode of body.childNodes) {
        //
        // The structure of WHATWG HTML Standard
        // 
        // body
        //   header
        //   h2
        //   h3
        //   p
        //   ...
        //
        if (isHeader && childNode.nodeName === 'header') {
            const id = getAttribute(childNode, 'id');
            header = {
                id: id,
                nodes: [childNode],
                text: null
            }
            isHeader = false;
            continue;
        }

        if (childNode.nodeName === 'h2') {
            const id = getAttribute(childNode, 'id');
            // end of the main contents
            if (id === 'index') {
                break;
            }

            // begining of the main contents
            if (id === 'introduction') {
                inMain = true;
            }

            if (!inMain) {
                continue;
            }

            const headingText = getHeadingText(childNode);
            chapter = addSection(root, id, headingText, childNode);
            section = null;
            continue;
        }

        if (!inMain) {
            continue;
        }

        if (childNode.nodeName === 'h3') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);
            section = addSection(chapter, id, headingText, childNode);
            continue;
        }

        if (!section) {
            if ((childNode.nodeName === '#text' && childNode.value.trim() === '') ||
                (childNode.nodeName === 'div' && getAttribute(childNode, 'class') === 'status')) {
                continue;
            }

            const id = '__pre__';
            const headingText = '__pre__';
            section = addSection(chapter, id, headingText, childNode);
        } else {
            section.nodes.push(childNode);
        }
    }

    const spec: Spec = {
        header: header,
        chapters: root.sections
    };

    fillText(doc, spec);

    return spec;
}
