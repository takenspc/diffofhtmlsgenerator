'use strict';
import * as path from 'path';
import { ASTNode } from 'parse5';
import { writeFile, mkdirp, sha256 } from '../../utils';
import { writeJSONEntry } from '../../jsonEntry';
import { Document } from './document';
import { Section, Header, toJSONEntry, nextLeafSection } from './section';


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
