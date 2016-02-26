'use strict'; // XXX
import * as assert from 'assert';
import { ASTNode } from 'parse5';
import { hasClassName } from '../../html';
import { JSONEntry } from '../../jsonEntry';


export interface Section {
    id: string

    path: string
    headingText: string
    originalHeadingText: string

    nodes: ASTNode[]
    hash: string

    sections: Section[]
}

export interface Header {
    id: string
    nodes: ASTNode[]
}


// for debug
function formatStartTag(node: ASTNode) {
    return `<${node.tagName} ${node.attrs.map((attr) => {
        return `${attr.name}="${attr.value}"`;
    }).join(' ')}>`
}

//
//
// 
export function addChildNode(parent: Section, current: Section, childNode: ASTNode): Section {
    // adding preface contents
    if (!current) {
        if ((childNode.nodeName === '#text' && childNode.value.trim() === '') ||
            hasClassName(childNode, 'div', 'status')) {
            return current;
        }

        assert(parent, '__pre__ must have a parent:' + formatStartTag(childNode));
        const id = '__pre__';
        const headingText = '__pre__';
        const originalHeadingText = '__pre__';
        return addSection(parent, id, headingText, originalHeadingText, childNode);
    }

    // normal
    current.nodes.push(childNode);
    return current;
}


function normalizeHeadingText(original: string): string {
    const replaceMap = new Map<string, string>([
        // Format:
        // [w3c text, whatwg text],
        //
        ['’', '\''],

        // Common infrastructure
        ['Plugin Content Handlers', 'Plugins'],
        ['Colors', 'Colours'],

        // Requirements for providing text to act as an alternative for images
        ['A link or button containing nothing but an image', 'A link or button containing nothing but the image'],
        ['Images of text', 'Text that has been rendered to a graphic for typographical effect'],

        // Media elements
        // Synchronising multiple media elements
        ['Synchronizing', 'Synchronising'],

        // The input element
        // Colour state (type=color)
        ['Color ', 'Colour '],
        // Implementation notes regarding localization of form controls
        ['implementation notes', 'Implementation notes'],
        // Common event behaviours
        ['behaviors', 'behaviours'],

        // The canvas element
        // Colour spaces and colour correction
        ['color ', 'colour '],

        // Serialising HTML fragments
        // Serialising XHTML fragments
        ['Serializing', 'Serialising'],
    ]);

    let headingText = original;
    for (const pair of replaceMap) {
        headingText = headingText.replace(pair[0], pair[1]);
    }

    return headingText;
}

function getSafePath(value: string): string {
    let safePath = value;
    // https://support.microsoft.com/kb/100108
    const ntfsUnsafe = /[?"/\<>*|:]/g;
    safePath = value.replace(ntfsUnsafe, '_')

    // Firebase
    const firebaseUnsafe = /[.#$\[\]]/g;
    safePath = safePath.replace(firebaseUnsafe, '_')
    return safePath;
}

export function addSection(parent: Section, id: string, headingText: string, originalHeadingText: string, childNode: ASTNode): Section {
    let normalizedHeadingText = normalizeHeadingText(headingText);

    // path is not for human, for system
    let path = getSafePath(normalizedHeadingText);
    path = (parent) ? parent.path + '/' + path : path;

    let nodes = [childNode];

    // preface
    if (id === '__pre__') {
        id = parent.id;
        normalizedHeadingText = `(preface of “${parent.headingText}”)`;
        originalHeadingText = `(preface of “${parent.originalHeadingText}”)`;
        // move parent.nodes which containing one h1-h6 element to __pre__
        nodes = parent.nodes.concat(nodes);
        parent.nodes = [];
    }

    const section: Section = {
        id: id,

        path: path,
        headingText: normalizedHeadingText,
        originalHeadingText: originalHeadingText,

        nodes: nodes,
        hash: null,

        sections: [],
    };

    if (parent) {
        parent.sections.push(section);
    }
    return section;
}


//
// fixup sections 
//
export function fixupSection(parent: Section): void {
    for (const section of parent.sections) {
        fixupSection(section);
    }

    //
    // move __pre__/__pre__ into parent
    //
    // if parent has only __pre__, merge __pre__ into parent
    if (parent.sections.length === 1) {
        const section = parent.sections[0];
        if (section.id === parent.id) {
            // merge __pre__ into root
            assert(parent.nodes.length === 0, `section which have __pre__ must not have nodes: ${parent.path}`);
            parent.nodes = section.nodes;
            // remove __pre__
            parent.sections = [];
        }
    }

    //
    // remove trailing whitespace text nodes
    //
    for (let i = parent.nodes.length - 1; 0 <= i; --i) {
        const node = parent.nodes[i];
        if (node.nodeName !== '#text' || node.value.trim() !== '') {
            break;
        }
        parent.nodes.pop();
    }
}


//
// iterable
//
export function* nextLeafSection(parent: Section): Iterable<Section> {
    for (const section of parent.sections) {
        if (section.sections.length === 0) {
            yield section;
        } else {
            yield* nextLeafSection(section);
        }
    }
}


//
// JSONEntry
//
export function toJSONEntry(section: Section): JSONEntry {
    const sections = section.sections.map(toJSONEntry);

    const jsonEntry: JSONEntry = {
        id: section.id,
        path: section.path,
        headingText: section.headingText,
        originalHeadingText: section.originalHeadingText,
        sections: sections,
        hash: {
            splitted: section.hash,
            formatted: null,
        },
        diffStat: {
            total: 0,
            diffCount: 0,
        },
        bufferListLength: 0,
    };

    return jsonEntry;
}
