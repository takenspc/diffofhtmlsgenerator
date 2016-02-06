'use strict'; // XXX
import * as path from 'path';
import { readFile } from '../utils';
import { DiffEntry } from '../diff';
import { nextLeafSection } from './';


//
// Diff Entry
//
async function deployDiffSection(srcRoot: string, section: DiffEntry, diffRef: Firebase): Promise<void> {
    const sectionPath = section.path;

    const jsonPath = path.join(srcRoot, sectionPath + '.json');
    const jsonText = await readFile(jsonPath);
    const sectionDiff = JSON.parse(jsonText);

    const sectionRef = diffRef.child(sectionPath);
    await sectionRef.set(sectionDiff);
}

export async function deployDiff(srcRoot: string, diffEntries: DiffEntry[], diffRef: Firebase): Promise<void[]> {
    const sections = [];
    for (const section of nextLeafSection(diffEntries)) {
        sections.push(section);
    }

    return Promise.all(sections.map((section) => {
        return deployDiffSection(srcRoot, section, diffRef);
    }));
}
