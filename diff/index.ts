'use strict';
import * as path from 'path';
import { writeFile, readFile, mkdirp } from '../utils';
import { JSONEntry, readJSONEntry } from '../jsonEntry';
import { computeJSONDiff } from './jsonDiff';
import { computeHTMLDiff } from './htmlDiff';

export interface DiffEntry {
    path: string
    headingText: string
    originalHeadingText: string
    sections: DiffEntry[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

//
// XXX Reoder W3C 'Links' of 'The elements of HTML'
//
function reorderW3CSemantics(sections: JSONEntry[]): JSONEntry[] {
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

function reoderW3C(entries: JSONEntry[]): JSONEntry[] {
    for (const entry of entries) {
        // 4 The elements of HTML
        if (entry.id === 'semantics') {
            entry.sections = reorderW3CSemantics(entry.sections);
        }
    }
    return entries;
}


//
// Entry point
//
export async function diff() {
    const srcDir = path.join(__dirname, '..', 'formatter', 'data');
    const jsonEntries = await Promise.all([
        readJSONEntry(path.join(srcDir, 'whatwg')),
        readJSONEntry(path.join(srcDir, 'w3c')),
    ]);

    const whatwg = jsonEntries[0];
    const w3c = reoderW3C(jsonEntries[1]);

    const outDir = path.join(__dirname, 'data');
    await mkdirp(outDir);

    const diffEntries = computeJSONDiff(whatwg, w3c);

    const outPath = path.join(outDir, 'index.json');
    await writeFile(outPath, JSON.stringify(diffEntries));
    
    await computeHTMLDiff(diffEntries);
}
