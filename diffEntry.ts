'use strict';
import * as path from 'path';
import { readFile, writeFile } from './utils';
import { JSONEntry } from './jsonEntry';


export interface DiffEntry {
    path: string
    headingText: string
    originalHeadingText: string
    sections: DiffEntry[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

export function createStubDiffEntry(jsonEntry: JSONEntry): DiffEntry {
    const diffEntry: DiffEntry = {
        path: jsonEntry.path,
        headingText: jsonEntry.headingText,
        originalHeadingText: jsonEntry.originalHeadingText,
        sections: [],
        whatwg: null,
        w3c: null,
    }
    return diffEntry;
}

export function readDiffEntry(root: string): Promise<DiffEntry[]> {
    const jsonPath = path.join(root, 'index.json');
    return readFile(jsonPath).then((text) => {
        return JSON.parse(text);
    });
}

export function writeDiffEntry(root: string, json: DiffEntry[]): Promise<any> {
    const jsonPath = path.join(root, 'index.json');
    const text = JSON.stringify(json);

    return writeFile(jsonPath, text);
}

export function* nextLeafDiffEntry(entries: DiffEntry[]): Iterable<DiffEntry> {
    for (const entry of entries) {
        // XXX Firebase makes empty array be undefined
        // XXX section.sections must be always an array
        if (!entry.sections) {
            entry.sections = [];
        }

        if (entry.sections.length === 0) {
            yield entry;
        } else {
            yield* nextLeafDiffEntry(entry.sections);
        }
    }
}
