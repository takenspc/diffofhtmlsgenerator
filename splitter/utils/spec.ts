'use strict';
import * as path from 'path';
import { ASTNode } from 'parse5';
import { writeFile, mkdirp, sha256 } from '../../utils';
import { writeJSONEntry } from '../../jsonEntry';
import { Document } from './document';
import { Section, Header, toJSONEntry, nextLeafSection } from './section';


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


export class Spec {
    header: Header
    section: Section
    document: Document

    constructor(header: Header, section: Section, document: Document) {
        this.header = header;
        this.section = section;
        this.document = document;
    }

    async saveHTML(rootPath: string, section: Section): Promise<any> {
        const debugJSONPath = path.join(rootPath, section.path + '.json');
        await mkdirp(path.dirname(debugJSONPath));
        await writeFile(debugJSONPath, JSON.stringify(section.nodes.map((node) => {
            return formatNode(node);
        })));


        const text = this.document.getHTMLText(section.nodes);
        section.hash = sha256(text);

        const htmlPath = path.join(rootPath, section.path + '.html');
        await mkdirp(path.dirname(htmlPath));
        await writeFile(htmlPath, text);
    }

    async save(rootPath: string): Promise<void> {
        // saveHTML mutates section
        for (const section of nextLeafSection(this.section)) {
            await this.saveHTML(rootPath, section);
        };

        const json = toJSONEntry(this.section);
        await writeJSONEntry(rootPath, json.sections);
    }
}
