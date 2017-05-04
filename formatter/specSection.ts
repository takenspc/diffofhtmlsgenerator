import * as path from 'path';
import { readFile, writeFile } from '../shared/utils';
import { Section } from '../splitter/section';

export interface HashStat {
    splitted: string;
    formatted: string;
}

export class SpecSection {
    org: string;
    id: string;
    path: string;
    headingText: string;
    originalHeadingText: string;
    hash: HashStat = null;
    formattedHTMLsLength: number = 0;
    sections: SpecSection[] = [];

    constructor(section: Section, hash: HashStat, formattedHTMLsLength: number) {
        this.org = section.org;
        this.id = section.id;
        this.path = section.path;
        this.headingText = section.headingText;
        this.originalHeadingText = section.originalHeadingText;

        this.hash = hash;
        this.formattedHTMLsLength = formattedHTMLsLength;
    }

    //
    // Formatted HTML
    //
    private static FORMATTER_DIR_PATH = path.join(__dirname, 'data');
    private static FORMATTED_HTML_PATH(org: string, sectionPath: string, index: number): string {
        return path.join(SpecSection.FORMATTER_DIR_PATH, org, `${sectionPath}.${index}.html`);
    }

    static writeFormattedHTML(section: SpecSection, html: string, index: number): Promise<void> {
        const htmlPath = this.FORMATTED_HTML_PATH(section.org, section.path, index);

        return writeFile(htmlPath, html);
    }

    static readFormattedHTML(org: string, sectionPath: string, index: number): Promise<string> {
        const htmlPath = this.FORMATTED_HTML_PATH(org, sectionPath, index);

        return readFile(htmlPath);
    }

    //
    // Index
    //
    private static INDEX_JSON_PATH(org: string) {
        return path.join(this.FORMATTER_DIR_PATH, org, 'index.json');
    }

    static write(org: string, specSections: SpecSection[]): Promise<void> {
        const jsonPath = this.INDEX_JSON_PATH(org);
        const text = JSON.stringify(specSections);

        return writeFile(jsonPath, text);
    }

    static read(org: string): Promise<SpecSection[]> {
        const jsonPath = this.INDEX_JSON_PATH(org);

        return readFile(jsonPath).then((text) => {
            return JSON.parse(text);
        });
    }
}
