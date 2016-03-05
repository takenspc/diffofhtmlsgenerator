'use strict'; // XXX
import * as path from 'path';
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { getAttribute, hasClassName, getText } from '../html';
import { Spec } from './utils/spec';
import { Document } from './utils/document';
import { Section, Header, addSection, addChildNode, fixupSection } from './utils/section';

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
    'syntax',
    // 'the-xhtml-syntax',
    // 'rendering',
    'obsolete',
    // 'iana',

]);

const h4HavingH6 = new Set([
    'the-img-element',
    'media-elements',
    'the-input-element',
    'the-script-element',
    'the-canvas-element',
    'scripting-processing-model',
    'the-navigator-object',
    'requirements-for-implementations',
]);

//
// Heading text
//
function* nextText(node: ASTNode): Iterable<ASTNode> {
    for (const childNode of node.childNodes) {
        if (childNode.nodeName === '#text') {
            yield childNode;
        } else {
            if (!hasClassName(childNode, 'span', 'secno') &&
                !hasClassName(childNode, 'span', 'dfn-panel') &&
                !hasClassName(childNode, 'a', 'self-link')) {
                yield* nextText(childNode);
            }
        }
    }
}

function getHeadingText(node: ASTNode): string {
    const buff: string[] = [];

    for (const textNode of nextText(node)) {
        buff.push(textNode.value);
    }

    return buff.join('').trim().replace(/\s+/, ' ');
}


//
// Iterate child node of sectionElement
//
function* nextElement(sectionElement: ASTNode): Iterable<ASTNode> {
    for (const childNode of sectionElement.childNodes) {
        if (childNode.nodeName === 'div' || childNode.nodeName === 'section') {
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
    let h5Section: Section = null;
    let h6Section: Section = null;
    let processH6Sections = false;

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

            assert(h2Section === null, 'h2 section must be null before h2');

            // end of the main contents
            if (id === 'index') {
                return null;
            }

            const headingText = getHeadingText(childNode);
            h2Section = addSection(null, id, headingText, childNode);

            h3Section = null;
            h4Section = null;
            processH4Sections = h2HavingH4.has(id);
            h5Section = null;
            h6Section = null;
            processH6Sections = false;
            continue;
        }

        if (nodeName === 'h3') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);

            assert(h2Section, `h2 section must be initialized before adding an h3 section: ${headingText}`)
            h3Section = addSection(h2Section, id, headingText, childNode);

            h4Section = null;
            h5Section = null;
            h6Section = null;
            processH6Sections = false;
            continue;
        }

        // add child Node
        if (!processH4Sections) {
            h3Section = addChildNode(h2Section, h3Section, childNode);
            continue;
        }


        if (nodeName === 'h4') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);

            assert(h3Section, `h3 section must be initialized before adding an h4 section: ${headingText}`)
            h4Section = addSection(h3Section, id, headingText, childNode);

            h5Section = null;
            h6Section = null;
            processH6Sections = h4HavingH6.has(id);
            continue;
        }

        // add child Node
        if (!processH6Sections) {
            if (!h3Section) {
                h3Section = addChildNode(h2Section, h3Section, childNode);
                continue;
            }

            h4Section = addChildNode(h3Section, h4Section, childNode);
            continue;
        }


        if (nodeName === 'h5') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);

            assert(h4Section, `h4 section must be initialized before adding an h5 section: ${headingText}`)
            h5Section = addSection(h4Section, id, headingText, childNode);

            h6Section = null;
            continue;
        }

        if (nodeName === 'h6') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);

            assert(h5Section, `h5 section must be initialized before adding an h6 section: ${headingText}`)
            h6Section = addSection(h5Section, id, headingText, childNode);
            continue;
        }


        // add child Node
        if (!h5Section) {
            h5Section = addChildNode(h4Section, h5Section, childNode);
            continue;
        }

        h6Section = addChildNode(h5Section, h6Section, childNode);
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

    fixupSection(root);

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
})().catch((err) => {
    console.error(err);
    console.error(err.stack);
    process.exit(-1);
});
