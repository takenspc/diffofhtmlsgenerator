import * as path from 'path';
import { SpecSection } from '../../jsonEntry';
import { Document } from './document';
import { Section, nextLeafSection } from './section';

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
        for (const section of nextLeafSection(this.rootSection)) {
            await section.writeJson();

            const html = this.document.getHTMLText(section.nodes);
            await section.writeHTML(html);
        };

        const rootSpecSection = new SpecSection(this.rootSection);
        await SpecSection.write(this.org, rootSpecSection.sections);
    }
}
