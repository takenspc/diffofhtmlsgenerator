'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getBody, getAttribute, getText } from './htmlutils';
import { Spec, Header, Section, addSection, addChildNode, fillText } from './parserutils';


function parseHeader(divNode: ASTNode): Header {
    let header: Header = null;

    for (const childNode of divNode.childNodes) {
        if (childNode.nodeName === 'header') {
            const id = getAttribute(childNode, 'id');
            header = {
                id: id,
                nodes: [childNode],
                text: null
            }
            break;
        }
    }

    return header;
}


function getHeadingText(node: ASTNode): string {
    for (const childNode of node.childNodes) {
        if (childNode.nodeName === 'span' && getAttribute(childNode, 'class') === 'content') {
            return getText(childNode).replace(/\s+/g, ' ').trim();
        }
    }

    throw new Error('Unexpected heading format');
}


function* nextElement(rootNode: ASTNode): Iterable<ASTNode> {
    // TODO
    for (const childNode of rootNode.childNodes) {
        if (childNode.nodeName === 'div' && getAttribute(childNode, 'class') === 'impl') {
            yield* nextElement(childNode);
        } else {
            yield childNode;
        }
    }
}

function parseMain(root: Section, mainNode: ASTNode): void {
    let chapter: Section = null;
    let section: Section = null;
    let subSection: Section = null;

    let inMain = false;
    let useH4 = false;

    const h4 = new Set(['semantics', 'syntax']);
    const h3InH4 = new Set([
        'disabled-elements',
        'serializing-html-fragments',
        'parsing-html-fragments',
        'named-character-references'
    ]);

    for (const sectionNode of mainNode.childNodes) {
        if (sectionNode.nodeName !== 'section') {
            continue;
        }

        for (const childNode of nextElement(sectionNode)) {
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
                subSection = null;
                continue;
            }

            if (childNode.nodeName === 'h3') {
                const id = getAttribute(childNode, 'id');
                let headingText = getHeadingText(childNode);

                // XXX
                headingText = headingText.replace('Serializing', 'Serialising');

                section = addSection(chapter, id, headingText, childNode);
                subSection = null;
                continue;
            }

            // in #semantics and #syntax, process h4
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
    }
}

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

    const bodyNode = getBody(doc);

    for (const childNode of bodyNode.childNodes) {
        //
        // The structure of W3C HTML 5.1
        // 
        // body
        //   div.head
        //     header
        //   h2
        //   h3
        //   main
        //     section
        //   ...
        //
        if (childNode.nodeName === 'div' && getAttribute(childNode, 'class') === 'head') {
            header = parseHeader(childNode);
        } else if (childNode.nodeName === 'main') {
            parseMain(root, childNode);
        }
    }

    const spec: Spec = {
        header: header,
        section: root
    };

    fillText(doc, spec);

    return spec;
}
