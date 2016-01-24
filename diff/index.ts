'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { JSONEntry } from '../splitter';
import { computeDiff, DiffEntry } from './diff';

//
// load json
//
function loadJSON(srcPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(srcPath, 'utf-8', (err, str) => {
            if (err) {
                reject(err);
                return;
            }

            const data = JSON.parse(str);
            resolve(data);
        });
    });    
}

function saveJSON(outPath: string, str: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(outPath, str, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
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
    const jsonEntries: JSONEntry[][] = await Promise.all([
        loadJSON(path.join(srcDir, 'whatwg', 'index.json')),
        loadJSON(path.join(srcDir, 'w3c', 'index.json')),
    ]);

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
    await saveJSON(outPath, JSON.stringify(diffEntries));
}