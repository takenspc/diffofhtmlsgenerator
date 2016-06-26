import * as path from 'path';
import { readFile, writeFile, sha256 } from './utils';
import { Section } from './splitter/utils/section';

export interface HashStat {
    splitted: string
    formatted: string
}

export class SpecSection {
    org: string
    id: string
    path: string
    headingText: string
    originalHeadingText: string
    sections: SpecSection[]
    hash: HashStat = null
    formattedHTMLsLength: number = 0

    constructor(section: Section) {
        this.org = section.org;
        this.id = section.id
        this.path = section.path;
        this.headingText = section.headingText;
        this.originalHeadingText = section.originalHeadingText;

        this.sections = section.sections.map((childSection) => {
            return new SpecSection(childSection);
        });
    }

    static updateHash(section: SpecSection, originalHTML: string, formattedHTMLs: string[]): void {
        section.hash = {
            splitted: sha256(originalHTML),
            formatted: sha256(formattedHTMLs.join(''))
        };

        section.formattedHTMLsLength = formattedHTMLs.length;
    }


    //
    // Original HTML
    //
    private static SPLITTER_DIR_PATH = path.join(__dirname, 'splitter', 'data')
    private static ORIGINAL_HTML_PATH(section: SpecSection): string {
        return path.join(SpecSection.SPLITTER_DIR_PATH, section.org, `${section.path}.html`);
    }

    static readOriginalHTML(section: SpecSection): Promise<string> {
        const htmlPath = this.ORIGINAL_HTML_PATH(section);

        return readFile(htmlPath);
    }


    //
    // Formatted HTML
    //
    private static FORMATTER_DIR_PATH = path.join(__dirname, 'formatter', 'data')
    private static FORMATTED_HTML_PATH(org: string, sectionPath: string, index: number): string {
        return path.join(SpecSection.FORMATTER_DIR_PATH, org, `${path}.${index}.html`);
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

export function* nextLeafSpecSection(entries: SpecSection[]): Iterable<SpecSection> {
    for (const entry of entries) {
        if (entry.sections.length > 0) {
            yield* nextLeafSpecSection(entry.sections);
        } else {
            yield entry;
        }
    }
}
