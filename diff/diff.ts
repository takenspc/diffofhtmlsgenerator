'use strict';
import { JSONEntry } from '../splitter';

export interface DiffEntry {
    heading: string
    htmlPath: string
    sections: DiffEntry[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

function createStubDiffEntry(jsonEntry: JSONEntry): DiffEntry {
    const diffEntry: DiffEntry = {
        heading: jsonEntry.heading,
        htmlPath: jsonEntry.htmlPath,
        sections: null,
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

export function computeDiff(whatwg: JSONEntry[], w3c: JSONEntry[]): DiffEntry[] {
    const entries: DiffEntry[] = [];

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
            entries.push(createDiffEntry(whatwgEntry, w3cEntry));
            continue
        }

        // if w3cEntry is undefined, insert whatwgEntry
        entries.push(createDiffEntry(whatwgEntry, null));

        if (w3cEntry) {
            w3cRemains.unshift(w3cEntry);
        }
    }

    // insert w3cEntry
    for (const w3cEntry of w3cRemains) {
        entries.push(createDiffEntry(null, w3cEntry));
    }

    return entries;
}
