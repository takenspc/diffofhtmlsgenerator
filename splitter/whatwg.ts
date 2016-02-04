'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getBody, getAttribute, getText } from './htmlutils';
import { Spec, Header, Section, addSection, addChildNode, fillText } from './parserutils';

//
// Config
//
const chapterHavingSubSections = new Set([
    // 'introduction',
    'infrastructure',
    'dom',
    'semantics',
    'editing',
    'browsers',
    'webappapis',
    'syntax'
    // 'the-xhtml-syntax',
    // 'rendering',
    // 'obsolete',
    // 'iana',

]);
const sectionNotHavingSubSections = new Set([
    // 'introduction',
    // 'infrastructure',
    'case-sensitivity-and-string-comparison',
    'namespaces',
    // 'dom',

    // 'semantics',
    'disabled-elements',

    // 'editing',
    'the-hidden-attribute',
    'inert-subtrees',
    'activation',

    // 'browsers'
    'sandboxing',

    // 'webappapis',
    'atob',
    'timers',
    'images',
    'animation-frames',

    // 'syntax'
    'serialising-html-fragments',
    'parsing-html-fragments',
    'named-character-references',

    // 'the-xhtml-syntax',
    // 'rendering',
    // 'obsolete',
    // 'iana',
]);


//
// Header text
//
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
        path: '',
        headingText: '#root#',
        originalHeadingText: '#root#',
        nodes: [],
        text: null,
        sections: [],
    };

    let header: Header;


    let isHeader = true;
    let inMain = false;

    let chapter: Section = null;
    let section: Section = null;
    let subSection: Section = null;
    let processSubSections = false;

    const body = getBody(doc);
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
        const nodeName = childNode.nodeName;
        if (isHeader && nodeName === 'header') {
            const id = getAttribute(childNode, 'id');
            header = {
                id: id,
                nodes: [childNode],
                text: null
            }
            isHeader = false;
            continue;
        }

        if (nodeName === 'h2') {
            const id = getAttribute(childNode, 'id');
            // end of the main contents
            if (id === 'index') {
                break;
            }

            // beginning of the main contents
            if (id === 'introduction') {
                inMain = true;
            }

            if (!inMain) {
                continue;
            }

            const headingText = getHeadingText(childNode);
            chapter = addSection(null, id, headingText, getText(childNode), childNode);
            section = null;
            subSection = null;
            processSubSections = chapterHavingSubSections.has(id);
            // TODO
            root.sections.push(chapter);
            continue;
        }

        if (!inMain) {
            continue;
        }

        if (nodeName === 'h3') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);
            section = addSection(chapter, id, headingText, getText(childNode), childNode);
            subSection = null;
            continue;
        }

        // in #semantics, process h4
        if (processSubSections && (section && !sectionNotHavingSubSections.has(section.id))) {
            if (nodeName === 'h4') {
                const id = getAttribute(childNode, 'id');
                const headingText = getHeadingText(childNode);

                subSection = addSection(section, id, headingText, getText(childNode), childNode);
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

