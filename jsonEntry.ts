import * as path from 'path';
import { readFile, writeFile} from './utils';


export interface DiffStat {
    total: number
    diffCount: number
}

export interface JSONEntry {
    id: string
    path: string
    headingText: string
    originalHeadingText: string
    sections: JSONEntry[]
    hash: {
        splitted: string
        formatted: string
    }
    diffStat: DiffStat
    bufferListLength: number
}

export function writeJSONEntry(root: string, json: JSONEntry[]): Promise<void> {
    const jsonPath = path.join(root, 'index.json');
    const text = JSON.stringify(json);

    return writeFile(jsonPath, text);
}

export function readJSONEntry(root: string): Promise<JSONEntry[]> {
    const jsonPath = path.join(root, 'index.json');
    return readFile(jsonPath).then((text) => {
        return JSON.parse(text);
    });
}

export function* nextJSONEntry(entries: JSONEntry[]): Iterable<JSONEntry> {
    for (const entry of entries) {
        if (entry.sections.length > 0) {
            yield* nextJSONEntry(entry.sections);
        } else {
            yield entry;
        }
    }
}
