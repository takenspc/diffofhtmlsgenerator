import * as assert from 'assert';
import { AST } from 'parse5';
import * as path from 'path';
import { getAttribute, getText, hasClassName } from '../shared/html';
import { addChildNode, addSection, Section } from './section';
import { Document } from './utils/document';
import { Spec } from './utils/spec';

//
// Config
//
const h2HavingH4: Set<string> = new Set([
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

const h4HavingH6: Set<string> = new Set([
    'The elements of HTML/Embedded content/The img element',
    'The elements of HTML/Embedded content/Media elements',
    'The elements of HTML/Forms/The input element',
    'The elements of HTML/Scripting/The script element',
    'The elements of HTML/Scripting/The canvas element',
    'Web application APIs/Scripting/Processing model',
    'Web application APIs/System state and capabilities/The Navigator object',
]);

//
// Heading text
//
function* nextText(node: AST.Default.Element): Iterable<AST.Default.TextNode> {
    for (const childNode of node.childNodes) {
        if (childNode.nodeName === '#text') {
            yield childNode as AST.Default.TextNode;
        } else {
            const childNodeAsElement = childNode as AST.Default.Element;
            if (!hasClassName(childNodeAsElement, 'span', 'secno') &&
                !hasClassName(childNodeAsElement, 'span', 'dfn-panel') &&
                !hasClassName(childNodeAsElement, 'a', 'self-link')) {
                yield* nextText(childNodeAsElement);
            }
        }
    }
}

function getHeadingText(node: AST.Default.Element): string {
    const buff: string[] = [];

    for (const textNode of nextText(node)) {
        buff.push(textNode.value);
    }

    return buff.join('').trim().replace(/\s+/, ' ');
}

//
// Iterate child node of sectionElement
//
function* nextElement(sectionElement: AST.Default.Element): Iterable<AST.Default.Element> {
    for (const childNode of sectionElement.childNodes as AST.Default.Element[]) {
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
function parseSectionElement(sectionNode: AST.Default.Element, root: Section): Section {
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
            h2Section = addSection(root, id, headingText, childNode);

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

            assert(h2Section, `h2 section must be initialized before adding an h3 section: ${headingText}`);
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

            assert(h3Section, `h3 section must be initialized before adding an h4 section: ${headingText}`);
            h4Section = addSection(h3Section, id, headingText, childNode);

            h5Section = null;
            h6Section = null;
            processH6Sections = h4HavingH6.has(h4Section.path);
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

            assert(h4Section, `h4 section must be initialized before adding an h5 section: ${headingText}`);
            h5Section = addSection(h4Section, id, headingText, childNode);

            h6Section = null;
            continue;
        }

        if (nodeName === 'h6') {
            const id = getAttribute(childNode, 'id');
            const headingText = getHeadingText(childNode);

            assert(h5Section, `h5 section must be initialized before adding an h6 section: ${headingText}`);
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

function parseMainElement(root: Section, mainNode: AST.Default.Element): void {
    for (const sectionNode of mainNode.childNodes as AST.Default.Element[]) {
        if (sectionNode.nodeName === 'section') {
            const section = parseSectionElement(sectionNode, root);
            if (!section) {
                return;
            }
        }
    }
}

function parseSpec(spec: Spec): void {
    const bodyNode = spec.document.getBody();

    for (const childNode of bodyNode.childNodes as AST.Default.Element[]) {
        //
        // The structure of W3C HTML
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
        if (childNode.nodeName === 'main') {
            parseMainElement(spec.rootSection, childNode);
        }
    }

    spec.rootSection.fixup();
}

//
// Entry point
//
if (require.main === module) {
    const org = 'w3c';
    const spec = new Spec(org);
    spec.init().then(() => {
        parseSpec(spec);
        return spec.save();
    }).catch((err) => {
        throw err;
    });
}
