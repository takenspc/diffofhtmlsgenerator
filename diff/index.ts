'use strict';
import * as assert from 'assert';
import * as path from 'path';
import { writeFile, readFile, mkdirp } from '../utils';
import { JSONEntry, readJSONEntry } from '../jsonEntry';
import { DiffEntry, writeDiffEntry } from '../diffEntry';
import { computeJSONDiff } from './jsonDiff';
import { computeHTMLDiff } from './htmlDiff';

/**
 * move targetId section before referenceId
 */
function moveEntryBefore(entries: JSONEntry[], targetId: string, referenceId: string): JSONEntry[] {
    const tmp: JSONEntry[] = [];
    let target: JSONEntry = null;
    let reference: JSONEntry = null;
    for (const entry of entries) {
        const id = entry.id;
        if (entry.id === targetId) {
            target = entry;
            continue;
        }

        if (entry.id === referenceId) {
            reference = entry;
        }

        tmp.push(entry);
    }
    assert(target, `There must be #${targetId} section`);
    assert(reference, `There must be #${referenceId} section`);

    const reorderd: JSONEntry[]= [];    
    for (const entry of tmp) {
        if (entry === reference) {
            reorderd.push(target);
        }

        reorderd.push(entry);
    }

    return reorderd;
}

function getEntryById(entries: JSONEntry[], id: string): JSONEntry {
    for (const entry of entries) {
        if (entry.id === id) {
            return entry;
        }
    }

    let child = null;
    for (const entry of entries) {
        child = getEntryById(entry.sections, id);
        if (child) {
            return child;
        }
    }

    return null;
}

function reoderW3C(entries: JSONEntry[]): void {
    // 4 The elements of HTML
    const semantics = getEntryById(entries, 'semantics');
    assert(semantics, 'w3c entries must have #semantics section');
    // Move 'Links' before 'Edits'
    semantics.sections = moveEntryBefore(semantics.sections, 'links', 'edits');
    
    // 7 Web application APIs
    const processingModel = getEntryById(entries, 'scripting-processing-model');
    assert(processingModel, 'w3c entries must have #scripting-processing-model section');
    // Move 'Calling scripts' before 'Killing scripts'
    processingModel.sections = moveEntryBefore(processingModel.sections, 'calling-scripts', 'killing-scripts');
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
    const w3c = jsonEntries[1];

    // reorder 
    reoderW3C(w3c);

    const diffEntries = computeJSONDiff(whatwg, w3c);

    const outDir = path.join(__dirname, 'data');
    await mkdirp(outDir);

    // computeHTMLDiff mutates diffEntries
    await computeHTMLDiff(diffEntries);

    await writeDiffEntry(outDir, diffEntries);
}
