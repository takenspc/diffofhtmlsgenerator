import * as path from 'path';
import { readFile, writeFile } from './utils';
import { JSONEntry } from './jsonEntry';


export interface UnifiedSection {
    path: string
    headingText: string
    originalHeadingText: string
    sections: UnifiedSection[]
    whatwg: JSONEntry
    w3c: JSONEntry
}

export function toUnifiedSection(whatwgEntry: SpecSection, w3cEntry: SpecSection): UnifiedSection {
    const baseEntry = whatwgEntry ? whatwgEntry : w3cEntry;
    const unifiedSectionEntry: UnifiedSection = {
        path: baseEntry.path,
        headingText: baseEntry.headingText,
        originalHeadingText: baseEntry.originalHeadingText,
        sections: [],
        whatwg: whatwgEntry,
        w3c: w3cEntry,
    }
    return unifiedSectionEntry;
}

export function* nextLeafUnifiedSection(entries: UnifiedSection[]): Iterable<UnifiedSection> {
    for (const entry of entries) {
        // XXX Firebase makes empty array be undefined
        // XXX section.sections must be always an array
        if (!entry.sections) {
            entry.sections = [];
        }

        if (entry.sections.length === 0) {
            yield entry;
        } else {
            yield* nextLeafUnifiedSection(entry.sections);
        }
    }
}
