import * as path from 'path';
import { readFile, writeFile } from '../shared/utils';
import { SpecSection, HashStat } from '../formatter/specSection';
import { LineDiff } from './htmlDiffChild';


export interface DiffStat {
    total: number
    diffCount: number
}

export class FlattedSpecSection {
    id: string
    originalHeadingText: string
    hash: HashStat
    diffStat: DiffStat

    constructor(specSection: SpecSection) {
        this.id = specSection.id;
        this.originalHeadingText = specSection.originalHeadingText;
        this.hash = specSection.hash;
        this.diffStat = {
            total: 0,
            diffCount: 0
        };
    }
}

export class UnifiedSection {
    path: string
    headingText: string
    originalHeadingText: string
    sections: UnifiedSection[]
    whatwg: FlattedSpecSection
    w3c: FlattedSpecSection
    formattedHTMLsLength: number

    constructor(whatwg: SpecSection, w3c: SpecSection) {
        const specSection = whatwg ? whatwg : w3c;
        this.path = specSection.path;
        this.headingText = specSection.headingText;
        this.originalHeadingText = specSection.originalHeadingText;
        this.sections = [];

        this.whatwg = whatwg ? new FlattedSpecSection(whatwg) : null;
        this.w3c = w3c ? new FlattedSpecSection(w3c) : null;
        this.formattedHTMLsLength = this.computeFormattedHtmlsLength(whatwg, w3c);
    }


    //
    // Formatted HTML
    //
    private computeFormattedHtmlsLength(whatwg: SpecSection, w3c: SpecSection): number {
        const whatwgLength = whatwg ? whatwg.formattedHTMLsLength : 0;
        const w3cLength = w3c ? w3c.formattedHTMLsLength : 0;
        return whatwgLength > w3cLength ? whatwgLength : w3cLength;
    }

    static readHTMLs(section: UnifiedSection, index: number): Promise<string[]> {
        return Promise.all([
            section.whatwg ? SpecSection.readFormattedHTML('whatwg', section.path, index) : '',
            section.w3c ? SpecSection.readFormattedHTML('w3c', section.path, index) : '',
        ]);
    }


    //
    // LineDiff
    //
    private static DIFF_DIR_PATH = path.join(__dirname, 'data')
    private static DIFF_JSON_PATH(section: UnifiedSection): string {
        return path.join(this.DIFF_DIR_PATH, `${section.path}.json`);
    }

    static writeLineDiffs(section: UnifiedSection, lineDiffs: LineDiff[]): Promise<void> {
        const jsonPath = this.DIFF_JSON_PATH(section);

        return writeFile(jsonPath, JSON.stringify(lineDiffs))
    }

    static readLineDiffs(section: UnifiedSection): Promise<LineDiff[]> {
        const jsonPath = this.DIFF_JSON_PATH(section);

        return readFile(jsonPath).then((text) => {
            return JSON.parse(text);
        });
    }

    //
    // Index
    //
    private static INDEX_JSON_PATH() {
        return path.join(this.DIFF_DIR_PATH, 'index.json');
    }

    static write(unifiedSections: UnifiedSection[]): Promise<void> {
        const jsonPath = this.INDEX_JSON_PATH();
        const text = JSON.stringify(unifiedSections);

        return writeFile(jsonPath, text);
    }

    static read(): Promise<UnifiedSection[]> {
        const jsonPath = this.INDEX_JSON_PATH();

        return readFile(jsonPath).then((text) => {
            return JSON.parse(text);
        });
    }
}

