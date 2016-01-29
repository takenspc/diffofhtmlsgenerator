'use strict';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { JSONEntry, readJSONEntry } from '../jsonEntry';
import { computeJSONDiff, DiffEntry } from './jsonDiff';
import { writeFile, readFile } from '../utils';
import { computeHTMLDiff } from './htmlDiff';

export interface DiffEntry {
    heading: string
    path: string
    sections: DiffEntry[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

function reorderW3CSemantics(sections: JSONEntry[]): JSONEntry[] {
    // TODO O(2n)

    const tmp: JSONEntry[] = [];
    let links: JSONEntry;
    for (const section of sections) {
        if (section.id === 'links') {
            links = section;
        } else {
            tmp.push(section);
        }
    }

    const reorderd: JSONEntry[]= [];    
    for (const section of tmp) {
        if (section.id === 'edits') {
            reorderd.push(links);
        }

        reorderd.push(section);
    }

    return reorderd;
}

// XXX
function reoderW3C(entries: JSONEntry[]): JSONEntry[] {
    for (const entry of entries) {
        // 4 The elements of HTML
        if (entry.id === 'semantics') {
            entry.sections = reorderW3CSemantics(entry.sections);
        }
    }
    return entries;
}

export async function diff() {
    const srcDir = path.join(__dirname, '..', 'splitter', 'data');
    const jsonEntries = await Promise.all([
        readJSONEntry(path.join(srcDir, 'whatwg')),
        readJSONEntry(path.join(srcDir, 'w3c')),
    ]);

    const whatwg = jsonEntries[0];
    const w3c = reoderW3C(jsonEntries[1]);

    const outDir = path.join(__dirname, 'data');
    mkdirp.sync(outDir);

    const diffEntries = computeJSONDiff(whatwg, w3c);

    const outPath = path.join(outDir, 'index.json');
    await writeFile(outPath, JSON.stringify(diffEntries));
    
    await computeHTMLDiff(diffEntries);
}
