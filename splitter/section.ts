import * as assert from 'assert';
import * as path from 'path';
import { ASTNode } from 'parse5';
import { hasClassName } from '../shared/html';
import { readFile, writeFile } from '../shared/utils';


export class Section {
    org: string
    id: string

    path: string
    headingText: string
    originalHeadingText: string

    nodes: ASTNode[]

    sections: Section[] = []

    constructor({ org, id, path, headingText, originalHeadingText, nodes}) {
        this.org = org;
        this.id = id;
        this.path = path;
        this.headingText = headingText;
        this.originalHeadingText = originalHeadingText;
        this.nodes = nodes;
    }


    //
    // JSON
    //
    private static SPLITTER_DIR_PATH(org: string) {
        return path.join(__dirname, 'data', org);
    }
    private static DATA_PATH(org: string, sectionPath: string, extension: string): string {
        return path.join(Section.SPLITTER_DIR_PATH(org), `${sectionPath}.${extension}`);
    }

    writeAstJson(): Promise<void> {
        const jsonPath = Section.DATA_PATH(this.org, this.path, 'json');
        const text = JSON.stringify(this.nodes.map((node) => {
            return formatNode(node);
        }));

        return writeFile(jsonPath, text);
    }


    //
    // HTML
    //
    writeHTML(html): Promise<void> {
        const htmlPath = Section.DATA_PATH(this.org, this.path, 'html');

        return writeFile(htmlPath, html);
    }

    static readSplittedHTML(section: Section): Promise<string> {
        const htmlPath = this.DATA_PATH(section.org, section.path, 'html');

        return readFile(htmlPath);
    }

    //
    // Root
    //
    get isRoot(): boolean {
        return this.id === '#root#';
    }

    static createRootSection(org: string): Section {
        const root: Section = new Section({
            org: org,
            id: '#root#',
            path: '',
            headingText: '#root#',
            originalHeadingText: '#roort#',
            nodes: []
        });

        return root;
    }


    //
    // Index
    //
    private static INDEX_JSON_PATH(org: string) {
        return path.join(this.SPLITTER_DIR_PATH(org), 'index.json');
    }

    static write(org: string, sections: Section[]): Promise<void> {
        const jsonPath = this.INDEX_JSON_PATH(org);
        const text = JSON.stringify(sections, (key, value) => {
            if (key === 'nodes') {
                return null;
            }

            return value;
        });

        return writeFile(jsonPath, text);
    }

    static read(org: string): Promise<Section[]> {
        const jsonPath = this.INDEX_JSON_PATH(org);

        return readFile(jsonPath).then((text) => {
            return JSON.parse(text);
        });
    }

}


// for debug
function formatNode(node: ASTNode): string {
    if (node.nodeName === '#text') {
        return node.value;
    }

    let str = `<${node.tagName}${node.attrs.map((attr) => {
        return ` ${attr.name}="${attr.value}"`;
    }).join('')}>`

    for (const child of node.childNodes) {
        str += formatNode(child);
    }

    str += `</${node.tagName}>`;

    return str;
}

function formatStartTag(node: ASTNode): string {
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
        return addSection(parent, id, headingText, childNode);
    }

    // normal
    current.nodes.push(childNode);
    return current;
}


function normalizeHeadingText(original: string): string {
    const replaceMap = new Map<any, string>([
        // Format:
        // [w3c text, whatwg text],
        //
        ['’', '\''],

        // Common infrastructure
        ['Plugin Content Handlers', 'Plugins'],
        ['Colors', 'Colours'],

        // The elements of HTML
        ['The root element', 'The document element'],

        // Requirements for providing text to act as an alternative for images
        ['A link or button containing nothing but an image', 'A link or button containing nothing but the image'],
        ['Images of text', 'Text that has been rendered to a graphic for typographical effect'],

        // Media elements
        // Synchronising multiple media elements
        ['Synchronizing', 'Synchronising'],

        // The input element
        // Colour state (type=color)
        ['Color ', 'Colour '],
        // Common event behaviours
        ['behaviors', 'behaviours'],
        // APIs for text field selections
        ['APIs for text field selections', 'APIs for the text field selections'],

        // The canvas element
        // Colour spaces and colour correction
        ['color ', 'colour '],

        // Navigating to a fragment
        ['fragment identifier', 'fragment'],

        // Scripting
        // HostPromiseRejectionTracker(promise, operation)
        ['The HostPromiseRejectionTracker implementation', 'HostPromiseRejectionTracker(promise, operation)'],

        // Matching HTML elements using selectors and CSS
        [/^Matching HTML elements using selectors$/, 'Matching HTML elements using selectors and CSS'],

        // Drag-and-drop processing model
        ['Drag-and-drop processing model', 'Processing model'],

        // Serialising HTML fragments
        // Serialising XHTML fragments
        ['Serializing', 'Serialising'],
    ]);

    let headingText = original;
    for (const [target, replacement] of replaceMap) {
        headingText = headingText.replace(target, replacement);
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

function computePath(parent: Section, normalizedHeadingText: string): string {
    // path is not for human, for system
    const currentPath = getSafePath(normalizedHeadingText);
    if (parent.isRoot) {
        return currentPath;
    }

    return `${parent.path}/${currentPath}`;

}

export function addSection(parent: Section, id: string, headingText: string, childNode: ASTNode): Section {
    let originalHeadingText = headingText;
    let normalizedHeadingText = normalizeHeadingText(headingText);
    const path = computePath(parent, normalizedHeadingText);

    let nodes = [childNode];

    // preface
    if (id === '__pre__') {
        id = parent.id;
        normalizedHeadingText = `(preface of “${parent.headingText}”)`;
        originalHeadingText = `(preface of “${parent.originalHeadingText}”)`;
    }

    // move parent.nodes (h1-h6 elements) to its first section
    if (parent.sections.length === 0) {
        nodes = parent.nodes.concat(nodes);
        parent.nodes = [];
    }

    const section: Section = new Section({
        org: parent.org,
        id: id,

        path: path,
        headingText: normalizedHeadingText,
        originalHeadingText: originalHeadingText,

        nodes: nodes
    });

    parent.sections.push(section);

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

