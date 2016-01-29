'use strict';
import { JSONEntry } from '../jsonEntry';

export interface DiffEntry {
    heading: string
    path: string
    sections: DiffEntry[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

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

export function computeJSONDiff(whatwg: JSONEntry[], w3c: JSONEntry[]): DiffEntry[] {
    const diffEntries: DiffEntry[] = [];

    const whatwgRemains: JSONEntry[] = [].concat(whatwg);
    const w3cRemains: JSONEntry[] = [].concat(w3c);

    for (const whatwgEntry of whatwgRemains) {
        let w3cEntry = w3cRemains.shift();

        /*
        // if w3cEntry < whatwgEntry, insert w3cEntry
        while (w3cEntry && w3cEntry.heading < whatwgEntry.heading) {
            entries.push({
                heading: w3cEntry.heading,
                sections: null,
                whatwg: null,
                w3c: w3cEntry,
            });
            w3cEntry = w3cRemains.shift();
        }

        // if whatwgEntry < w3cEntry, insert whatwgEntry
        if (w3cEntry && whatwgEntry.heading < w3cEntry.heading) {
            // push back w3cEntry
            w3cRemains.unshift(w3cEntry);
            entries.push({
                heading: whatwgEntry.heading,
                sections: null,
                whatwg: whatwgEntry,
                w3c: null,
            });
            continue;
        }
        */

        // if whatwgEntry == w3cEntry, insert whatwgEntry and w3cEntry
        if (w3cEntry && compare(whatwgEntry, w3cEntry)) {
            diffEntries.push(createDiffEntry(whatwgEntry, w3cEntry));
            continue
        }

        // if w3cEntry is undefined, insert whatwgEntry
        diffEntries.push(createDiffEntry(whatwgEntry, null));

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
