import * as path from 'path';
import { nextLeafSection } from '../../shared/iterator';
import { Document } from './document';
import { Section } from '../section';

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
            await section.writeAstJson();

            const html = this.document.getHTMLText(section.nodes);
            await section.writeHTML(html);
        };

        await Section.write(this.org, sections);
    }
}
