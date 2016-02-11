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
    let headingText = original;

    // ’ → '
    headingText = headingText.replace('’', '\'');

    // Common infrastructure → Terminology → Plugins
    headingText = headingText.replace('Plugin Content Handlers', 'Plugins');

    // Common infrastructure → Common microsyntaxes → Colours
    //  The elements of HTML → Forms → The input element → States of the type attribute → Colour state (type=color)
    headingText = headingText.replace('Colors', 'Colours');
    headingText = headingText.replace('Color state', 'Colour state');

    // The elements of HTML → Forms → The input element → Common event behaviours
    headingText = headingText.replace('behaviors', 'behaviours');


    // The HTML syntax
    // The XHTML syntax
    headingText = headingText.replace('Serializing', 'Serialising');
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

    // preface
    if (id === '__pre__') {
        id = parent.id;
        normalizedHeadingText = '(preface)';
        originalHeadingText = `(preface of ${parent.originalHeadingText})`;
    }

    const section: Section = {
        id: id,

        path: path,
        headingText: normalizedHeadingText,
        originalHeadingText: originalHeadingText,

        nodes: [childNode],
        hash: null,

        sections: [],
    };

    if (parent) {
        parent.sections.push(section);
    }
    return section;
}


//
// move __pre__/__pre__ into parent
//
export function mergeNestedPrefaces(parent: Section): void {
    for (const section of parent.sections) {
        mergeNestedPrefaces(section);
    }

    // if parent has only __pre__, merge __pre__ into parent
    if (parent.sections.length === 1) {
        const section = parent.sections[0];
        if (section.id === parent.id) {
            // merge __pre__ into root
            parent.nodes = section.nodes;
            // remove __pre__
            parent.sections = [];
        }
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
