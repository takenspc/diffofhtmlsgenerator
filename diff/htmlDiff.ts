'use strict';
import { DiffEntry, nextLeafDiffEntry } from '../diffEntry';
import { diffSection } from './htmlDiffChild';


export async function computeHTMLDiff(sections: DiffEntry[]): Promise<void> {
    for (const section of nextLeafDiffEntry(sections)) {
        await diffSection(section);
        // XXX MAKE HEROKU HAPPY
        global.gc();
    }
}
