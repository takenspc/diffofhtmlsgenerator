'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { Document, getBody, getAttribute, getText } from './htmlutils';
import { Spec, Header, Chapter, addChapter, Section, addSection, fillText } from './parserutils';


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
            return getText(childNode);
        }
    }

    throw new Error('Unexpected heading format');
}


function* nextElement(rootNode: ASTNode) {
    // TODO
    for (const childNode of rootNode.childNodes) {
        if (childNode.nodeName === 'div' && getAttribute(childNode, 'class') === 'impl') {
            yield* nextElement(childNode);
        } else {
            yield childNode;
        }
    }
}

function parseMain(mainNode: ASTNode): Chapter[] {
    const chapters: Chapter[] = [];
    let chapter: Chapter = null;
    let section: Section = null;

    let inMain = false;

    for (const sectionNode of mainNode.childNodes) {
        if (sectionNode.nodeName !== 'section') {
            continue;
        }

        for (const childNode of nextElement(sectionNode)) {
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
                chapter = addChapter(chapters, id, headingText, childNode);
                section = null;
                continue;
            }

            if (childNode.nodeName === 'h3') {
                const id = getAttribute(childNode, 'id');
                let headingText = getHeadingText(childNode);

                // XXX
                headingText = headingText.replace('Serializing', 'Serialising');
                
                section = addSection(chapter, id, headingText, childNode);
                continue;
            }

            if (!section) {
                if ((childNode.nodeName === '#text' && childNode.value.trim() === '')) {
                    continue;
                }

                const id = '__pre__';
                const headingText = '__pre__';
                section = addSection(chapter, id, headingText, childNode);
            } else {
                section.nodes.push(childNode);
            }
        }
    }


    return chapters;
}

export function parseSpec(doc: Document): Spec {
    let chapters: Chapter[];
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
            chapters = parseMain(childNode);
        }
    }

    const spec: Spec = {
        header: header,
        chapters: chapters
    };

    fillText(doc, spec);

    return spec;
}
