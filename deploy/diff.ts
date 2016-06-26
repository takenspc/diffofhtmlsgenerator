import * as path from 'path';
import { readFile } from '../utils';
import { LineDiff } from '../diff/htmlDiffChild';
import { UnifiedSection, nextLeafUnifiedSection } from '../diffEntry';


//
// Diff Entry
//
export async function deployDiff(unifiedSections: UnifiedSection[], firebaseRef: Firebase): Promise<void> {
    for (const section of nextLeafUnifiedSection(unifiedSections)) {
        const lineDiffs: LineDiff[] = await UnifiedSection.readLineDiffs(section);
        const sectionRef = firebaseRef.child(section.path);
        await sectionRef.set(lineDiffs);
    }
}
