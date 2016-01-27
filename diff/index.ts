'use strict';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { JSONEntry } from '../splitter';
import { computeDiff, DiffEntry } from './jsonDiff';
import { writeFile, readFile } from '../utils';
import { computeHTMLDiff } from './htmlDiff';

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
    const jsonStrings = await Promise.all([
        readFile(path.join(srcDir, 'whatwg', 'index.json')),
        readFile(path.join(srcDir, 'w3c', 'index.json')),
    ]);

    const jsonEntries: JSONEntry[][] = jsonStrings.map((jsonString) => {
        return JSON.parse(jsonString);
    });

    const whatwg = jsonEntries[0];
    const w3c = reoderW3C(jsonEntries[1]);
        
    const diffEntries = computeDiff(whatwg, w3c);
    
    for (const diffEntry of diffEntries) {
        const whatwg = (diffEntry.whatwg) ? diffEntry.whatwg.sections : [];
        const w3c = (diffEntry.w3c) ? diffEntry.w3c.sections : [];

        if (whatwg.length > 0 || w3c.length > 0) {
            diffEntry.sections = computeDiff(whatwg, w3c);
        }
    }

    const outDir = path.join(__dirname, 'data');
    mkdirp.sync(outDir);

    const outPath = path.join(outDir, 'index.json');
    await writeFile(outPath, JSON.stringify(diffEntries));
    
    await computeHTMLDiff(diffEntries);
}
