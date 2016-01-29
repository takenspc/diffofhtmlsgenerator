'use strict';
import { JSONEntry } from '../jsonEntry';
import { DiffEntry } from './'

//
// Utils.
//
function createStubDiffEntry(jsonEntry: JSONEntry): DiffEntry {
    const diffEntry: DiffEntry = {
        heading: jsonEntry.heading,
        path: jsonEntry.path,
        sections: [],
        whatwg: null,
        w3c: null,
    }
    return diffEntry;
}

function createDiffEntry(whatwg: JSONEntry, w3c: JSONEntry): DiffEntry {
    const diffEntry: DiffEntry = createStubDiffEntry(whatwg ? whatwg : w3c);

    diffEntry.whatwg = whatwg;
    diffEntry.w3c = w3c;

    return diffEntry;
}

function compare(whatwg: JSONEntry, w3c: JSONEntry): boolean {
    const whatwgHeading = whatwg.heading;
    const w3cHeading = w3c.heading;
    
    if (whatwgHeading === w3cHeading) {
        return true;
    }

    return false;
}

//
// check whether `base` contains `target`
// if so return `index` which satisfies `base[index] === target`
//
function findIndexOfTargetEntry(target: JSONEntry, base: JSONEntry[], limit: number): number {
    const len = (limit < base.length) ? limit : base.length;

    for (let i = 0; i < len; i++) {
        if (compare(target, base[i])) {
            return i;
        }
    }

    return -1;
}


//
// Entry point
//
export function computeJSONDiff(whatwg: JSONEntry[], w3c: JSONEntry[]): DiffEntry[] {
    const diffEntries: DiffEntry[] = [];

    const whatwgRemains: JSONEntry[] = [].concat(whatwg);
    const w3cRemains: JSONEntry[] = [].concat(w3c);

    for (const whatwgEntry of whatwgRemains) {
        let w3cEntry = w3cRemains.shift();

        // if `whatwgEntry === w3cEntry`,
        // insert both `whatwgEntry` and ``w3cEntry`
        if (w3cEntry && compare(whatwgEntry, w3cEntry)) {
            diffEntries.push(createDiffEntry(whatwgEntry, w3cEntry));
            continue
        }

        // check whether `w3cRemains` contains `whatwgEntry`
        // in such caess, `index` satisfies `w3cRemains[index] === whatwgEntry`
        const index = findIndexOfTargetEntry(whatwgEntry, w3cRemains, 8);
        if (index > -1) {
            // insert w3c only entries (`w3cRemains[-1]` ... `w3cRemains[index - 1]`)
            //
            // NOTE: `w3cRemains[-1]` means current `w3cEntry`
            //
            for (let i = -1; i < index; i++) {
                diffEntries.push(createDiffEntry(null, w3cEntry));
                w3cEntry = w3cRemains.shift();
            }

            // Now, `w3cEntry` is `w3cRemains[index]` (=== `whatwgEntry`)
            // insert whatwg entry and w3c entry
            //
            // NOTE: w3cRemains has been muted by calling shift,
            // `w3cEntry === w3cRemains[index]` returns false
            //
            diffEntries.push(createDiffEntry(whatwgEntry, w3cEntry));
            continue;
        }

        // insert whatwg only Entry
        diffEntries.push(createDiffEntry(whatwgEntry, null));

        // push back w3cEntry
        if (w3cEntry) {
            w3cRemains.unshift(w3cEntry);
        }
    }

    // insert w3cEntry
    for (const w3cEntry of w3cRemains) {
        diffEntries.push(createDiffEntry(null, w3cEntry));
    }

    // process recursively
    for (const diffEntry of diffEntries) {
        const whatwg = (diffEntry.whatwg) ? diffEntry.whatwg.sections : [];
        const w3c = (diffEntry.w3c) ? diffEntry.w3c.sections : [];

        if (whatwg.length > 0 || w3c.length > 0) {
            diffEntry.sections = computeJSONDiff(whatwg, w3c);
        }
    }


    return diffEntries;
}
