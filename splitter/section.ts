import * as assert from 'assert';
import * as path from 'path';
import { AST } from 'parse5';
import { hasClassName } from '../shared/html';
import { readFile, writeFile } from '../shared/utils';
import { normalizeHeadingText } from './utils/headings';
import { formatNode, formatStartTag} from './utils/debug';


//
// Section
//
export class Section {
    private type: 'root' | 'pre' | 'normal'
    org: string
    id: string

    path: string
    headingText: string
    originalHeadingText: string

    nodes: AST.Default.Node[]

    sections: Section[] = []

    constructor(type: 'root' | 'pre' | 'normal', org: string, parent: Section, id: string, headingText: string, nodes: AST.Default.Node[]) {
        this.type = type;
        this.org = org;
        this.id = id;
        [this.headingText, this.originalHeadingText] = this.computeHeadings(parent, headingText);
        this.path = this.computePath(parent);

        // move parent.nodes (h1-h6 elements) to its first section
        if (parent && parent.sections.length === 0) {
            nodes = parent.nodes.concat(nodes);
            parent.nodes = [];
        }
        this.nodes = nodes;

        if (parent) {
            parent.sections.push(this);
        }
    }


    //
    // headings
    //
    private computeHeadings(parent: Section, originalHeadingText: string): [string, string] {
        if (this.type === 'root') {
            return ['', ''];
        }

        if (this.type === 'pre') {
            return [
                `(preface of “${parent.headingText}”)`,
                `(preface of “${parent.originalHeadingText}”)`
            ];
        };

        return [
            normalizeHeadingText(originalHeadingText),
            originalHeadingText
        ];
    }


    //
    // Path
    //
    private getSafePath(value: string): string {
        let safePath = value;
        // https://support.microsoft.com/kb/100108
        const ntfsUnsafe = /[?"/\<>*|:]/g;
        safePath = value.replace(ntfsUnsafe, '_')

        // Firebase
        const firebaseUnsafe = /[.#$\[\]]/g;
        safePath = safePath.replace(firebaseUnsafe, '_')
        return safePath;
    }

    private computePath(parent: Section): string {
        if (this.type === 'root') {
            return '';
        }

        // path is not for human, for system
        let current = this.type === 'pre' ? '__pre__' : this.headingText;
        current = this.getSafePath(current);
        if (parent.type === 'root') {
            return current;
        }

        return `${parent.path}/${current}`;
    }


    //
    // Root
    //
    static createRootSection(org: string): Section {
        const root: Section = new Section('root', org, null, '__root__', '', []);
        return root;
    }


    //
    // Fixup
    //
    fixup(): void {
        for (const section of this.sections) {
            section.fixup();
        }

        //
        // move __pre__/__pre__ into parent
        //
        // if parent has only __pre__, merge __pre__ into parent
        if (this.sections.length === 1) {
            const section = this.sections[0];
            if (section.type === 'pre') {
                // merge __pre__ into root
                assert(this.nodes.length === 0, `section which only has one __pre__ must not have nodes: ${this.path}`);
                this.nodes = section.nodes;
                // remove __pre__
                this.sections = [];
            }
        }

        //
        // remove trailing whitespace text nodes
        //
        for (let i = this.nodes.length - 1; 0 <= i; --i) {
            const node = this.nodes[i] as AST.Default.TextNode;
            if (node.nodeName !== '#text' || node.value.trim() !== '') {
                break;
            }
            this.nodes.pop();
        }
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

    writeDebugJson(): Promise<void> {
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


//
// Add children
// 
export function addChildNode(parent: Section, current: Section, childNode: AST.Default.Element | AST.Default.TextNode): Section {
    // adding preface contents
    if (!current) {
        // skip inrelevant nodes
        if ((childNode.nodeName === '#text' && (childNode as AST.Default.TextNode).value.trim() === '') ||
            hasClassName(childNode as AST.Default.Element, 'div', 'status')) {
            return current;
        }

        // preface contents
        assert(parent, `__pre__ must have a parent: ${formatStartTag(childNode as AST.Default.Element)}`);
        return new Section('pre', parent.org, parent, parent.id, '', [childNode]);
    }

    // normal
    current.nodes.push(childNode);
    return current;
}

export function addSection(parent: Section, id: string, headingText: string, childNode: AST.Default.Node): Section {
    const section: Section = new Section('normal', parent.org, parent, id, headingText, [childNode]);
    return section;
}

