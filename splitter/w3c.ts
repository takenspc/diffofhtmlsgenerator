'use strict'; // XXX
import * as path from 'path';
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, parse, getBody, getAttribute, hasClassName, getText } from './utils/htmlutils';
import { Spec, Header, Section, addSection, addChildNode } from './utils/parserutils';
import { saveSpec } from './utils/writeutils';

//
// Header
//
function parseHeader(divNode: ASTNode): Header {
    let header: Header = null;

    for (const childNode of divNode.childNodes) {
        if (childNode.nodeName === 'header') {
            const id = getAttribute(childNode, 'id');
            header = {
                id: id,
                nodes: [childNode],
            }
            break;
        }
    }

    return header;
}


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
    'base64-utility-methods',
    'timers',
    'webappapis-images',

    // 'syntax'
    'serializing-html-fragments',
    'parsing-html-fragments',
    'named-character-references',

    // 'the-xhtml-syntax',
    // 'rendering',
    // 'obsolete',
    // 'iana',
]);


//
// Heading text
//
function getHeadingText(node: ASTNode): string {
    for (const childNode of node.childNodes) {
        if (hasClassName(childNode, 'span', 'content')) {
            return getText(childNode).replace(/\s+/g, ' ').trim();
        }
    }

    throw new Error('Unexpected heading format');
}


//
// Iterate child node of sectionElement
//
function* nextElement(sectionElement: ASTNode): Iterable<ASTNode> {
    for (const childNode of sectionElement.childNodes) {
        if (hasClassName(childNode, 'div', 'impl') ||
            (childNode.nodeName === 'div' && getAttribute(childNode, 'data-fill-with'))) {
            yield* nextElement(childNode);
        } else {
            yield childNode;
        }
    }
}


//
// parse section element
//
function parseSectionElement(sectionNode: ASTNode): Section {
    let chapter: Section = null;
    let section: Section = null;
    let subSection: Section = null;
    let processSubSections = false;

    //
    // section
    //   h2
    //   h3
    //   ...
    //   h4
    //   ...
    //
    for (const childNode of nextElement(sectionNode)) {
        const nodeName = childNode.nodeName;

        if (nodeName === 'h2') {
            const id = getAttribute(childNode, 'id');

            assert(chapter === null, 'Chapter must be null before h2');

            // end of the main contents
            if (id === 'index') {
                return null;
            }

            const headingText = getHeadingText(childNode);
            chapter = addSection(null, id, headingText, getText(childNode), childNode);
            section = null;
            subSection = null;
            processSubSections = chapterHavingSubSections.has(id);
            continue;
        }

        if (nodeName === 'h3') {
            const id = getAttribute(childNode, 'id');
            let headingText = getHeadingText(childNode);

            assert(chapter, `chapter must be initialized before adding a section: ${headingText}`)
            section = addSection(chapter, id, headingText, getText(childNode), childNode);
            subSection = null;
            continue;
        }

        if (processSubSections && (section && !sectionNotHavingSubSections.has(section.id))) {
            if (nodeName === 'h4') {
                const id = getAttribute(childNode, 'id');
                const headingText = getHeadingText(childNode);

                assert(section, `section must be initialized before adding a sub section: ${headingText}`)
                subSection = addSection(section, id, headingText, getText(childNode), childNode);
                continue;
            }

            subSection = addChildNode(section, subSection, childNode);
        } else {
            section = addChildNode(chapter, section, childNode);
        }
    }

    return chapter;
}


function parseMainElement(root: Section, mainNode: ASTNode): void {
    for (const sectionNode of mainNode.childNodes) {
        if (sectionNode.nodeName === 'section') {
            const section = parseSectionElement(sectionNode);
            if (section) {
                root.sections.push(section);
            } else {
                return;
            }
        }
    }
}


function parseSpec(doc: Document): Spec {
    const root: Section = {
        id: '#root#',
        path: '',
        headingText: '#root#',
        originalHeadingText: '#roort#',
        nodes: [],
        hash: null,
        sections: [],
    };

    let header: Header;

    const bodyNode = getBody(doc);

    for (const childNode of bodyNode.childNodes) {
        //
        // The structure of W3C HTML 5.1
        //
        // body
        //   div.head
        //   h2#abstract
        //   div[data-fill-with="abstract"]
        //   h2#status
        //   div[data-fill-with="status"]
        //   div[data-fill-with="at-risk"]
        //   nav#toc[data-fill-with="table-of-contents"]
        //   main
        //     section
        //     ...
        //
        if (hasClassName(childNode, 'div', 'head')) {
            header = parseHeader(childNode);
        } else if (childNode.nodeName === 'main') {
            parseMainElement(root, childNode);
        }
    }

    const spec: Spec = {
        header: header,
        section: root,
    };

    return spec;
}

//
// Entry point
//
(async function() {
    const org = 'w3c';
    const htmlPath = path.join(__dirname, '..', 'fetcher', 'data', org, 'index.html');
    let doc = await parse(htmlPath);
    let spec = parseSpec(doc);

    const rootPath = path.join(__dirname, 'data', org);
    await saveSpec(rootPath, doc, spec);
})();
