'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getBody, getAttribute, getText } from './htmlutils';
import { Spec, Header, Section, addSection, addChildNode, fillText } from './parserutils';

function getHeadingText(node: ASTNode) {
    const text = getText(node);
    return text.replace(/\s+/g, ' ').replace(/^\d+(?:\.\d+)* /, '').trim();
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
        path: ''
    };

    let header: Header;

    const body = getBody(doc);

    let isHeader = true;
    let inMain = false;
    let useH4 = false;

    const h4 = new Set(['semantics', 'syntax']);
    const h3InH4 = new Set([
        'disabled-elements',
        'serialising-html-fragments',
        'parsing-html-fragments',
        'named-character-references'
    ]);

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
            useH4 = h4.has(id);
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

        // in #semantics, process h4
        if (useH4 && (section && !h3InH4.has(section.id))) {
            if (childNode.nodeName === 'h4') {
                const id = getAttribute(childNode, 'id');
                let headingText = getHeadingText(childNode);
                
                subSection = addSection(section, id, headingText, childNode);
                continue;
            }

            subSection = addChildNode(section, subSection, childNode);
        } else {
            section = addChildNode(chapter, section, childNode);
        }
    }

    const spec: Spec = {
        header: header,
        section: root
    };

    fillText(doc, spec);

    return spec;
}

