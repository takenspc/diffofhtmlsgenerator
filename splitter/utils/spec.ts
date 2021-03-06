import { AST } from 'parse5';
import * as path from 'path';
import { nextLeafSection } from '../../shared/iterator';
import { Section } from '../section';
import { Document } from './document';

export class Spec {
    private org: string
    rootSection: Section
    document: Document

    constructor(org: string) {
        this.org = org;
        this.rootSection = Section.createRootSection(org);
        this.document = new Document();
    }

    init(): Promise<void> {
        const htmlPath = path.join(__dirname, '..', '..', 'fetcher', 'data', this.org, 'index.html');
        return this.document.init(htmlPath);
    }

    async save(): Promise<void> {
        const sections = this.rootSection.sections;
        for (const section of nextLeafSection(sections)) {
            await section.writeDebugJson();

            const html = this.document.getHTMLText(section.nodes as AST.Default.Element[]);
            await section.writeHTML(html);
        }

        await Section.write(this.org, sections);
    }
}
