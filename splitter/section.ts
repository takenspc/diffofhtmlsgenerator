import * as assert from 'assert';
import * as path from 'path';
import { ASTNode } from 'parse5';
import { hasClassName } from '../shared/html';
import { readFile, writeFile } from '../shared/utils';
import { computeHeadings} from './utils/headings';
import { formatNode, formatStartTag} from './utils/debug';


//
// Section
//
export class Section {
    org: string
    id: string

    path: string
    headingText: string
    originalHeadingText: string

    nodes: ASTNode[]

    sections: Section[] = []

    constructor({ org, parent, id, headingText, nodes}) {
        this.org = org;
        this.id = id;
        [this.headingText, this.originalHeadingText, this.path] = computeHeadings(parent, id, headingText);

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
    // Root
    //
    get isRoot(): boolean {
        return this.id === '#root#';
    }

    static createRootSection(org: string): Section {
        const root: Section = new Section({
            org: org,
            parent: null,
            id: '#root#',
            headingText: '#root#',
            nodes: []
        });

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
            if (section.id === this.id) {
                // merge __pre__ into root
                assert(this.nodes.length === 0, `section which have __pre__ must not have nodes: ${this.path}`);
                this.nodes = section.nodes;
                // remove __pre__
                this.sections = [];
            }
        }

        //
        // remove trailing whitespace text nodes
        //
        for (let i = this.nodes.length - 1; 0 <= i; --i) {
            const node = this.nodes[i];
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
export function addChildNode(parent: Section, current: Section, childNode: ASTNode): Section {
    // adding preface contents
    if (!current) {
        // skip inrelevant nodes
        if ((childNode.nodeName === '#text' && childNode.value.trim() === '') ||
            hasClassName(childNode, 'div', 'status')) {
            return current;
        }

        // preface contents
        assert(parent, `__pre__ must have a parent: ${formatStartTag(childNode)}`);
        const id = '__pre__';
        const headingText = '__pre__';
        return addSection(parent, id, headingText, childNode);
    }

    // normal
    current.nodes.push(childNode);
    return current;
}

export function addSection(parent: Section, id: string, headingText: string, childNode: ASTNode): Section {
    const section: Section = new Section({
        org: parent.org,
        parent: parent,
        id: id,
        headingText: headingText,
        nodes: [childNode]
    });
    return section;
}

