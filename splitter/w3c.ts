'use strict'; // XXX
import * as path from 'path';
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { getAttribute, hasClassName, getText } from '../html';
import { Spec } from './utils/spec';
import { Document } from './utils/document';
import { Section, Header, addSection, addChildNode } from './utils/section';

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
const h2HavingH4 = new Set([
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
const h3NotHavingH4 = new Set([
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

const h4HavingH6 = new Set([
    'the-img-element',
    'the-input-element',
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
    let h2Section: Section = null;
    let h3Section: Section = null;
    let h4Section: Section = null;
    let processH4Sections = false;

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

            assert(h2Section === null, 'Chapter must be null before h2');

            // end of the main contents
            if (id === 'index') {
                return null;
            }

            const headingText = getHeadingText(childNode);
            h2Section = addSection(null, id, headingText, getText(childNode), childNode);
            h3Section = null;
            h4Section = null;
            processH4Sections = h2HavingH4.has(id);
            continue;
        }

        if (nodeName === 'h3') {
            const id = getAttribute(childNode, 'id');
            let headingText = getHeadingText(childNode);

            assert(h2Section, `chapter must be initialized before adding a section: ${headingText}`)
            h3Section = addSection(h2Section, id, headingText, getText(childNode), childNode);
            h4Section = null;
            continue;
        }

        if (processH4Sections && (h3Section && !h3NotHavingH4.has(h3Section.id))) {
            if (nodeName === 'h4') {
                const id = getAttribute(childNode, 'id');
                const headingText = getHeadingText(childNode);

                assert(h3Section, `section must be initialized before adding a sub section: ${headingText}`)
                h4Section = addSection(h3Section, id, headingText, getText(childNode), childNode);
                continue;
            }

            h4Section = addChildNode(h3Section, h4Section, childNode);
        } else {
            h3Section = addChildNode(h2Section, h3Section, childNode);
        }
    }

    return h2Section;
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

    const bodyNode = doc.getBody();

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

    return new Spec(header, root, doc);
}

//
// Entry point
//
(async function() {
    const org = 'w3c';

    const htmlPath = path.join(__dirname, '..', 'fetcher', 'data', org, 'index.html');
    let doc = await Document.parse(htmlPath);

    let spec = parseSpec(doc);
    const rootPath = path.join(__dirname, 'data', org);
    await spec.save(rootPath);
})();
