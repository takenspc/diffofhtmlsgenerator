import * as path from 'path';
import { readFile } from '../shared/utils';
import { nextLeafSection } from '../shared/iterator';
import { LineDiff } from '../diff/htmlDiffChild';
import { UnifiedSection } from '../diff/unifiedSection';


//
// Diff Entry
//
export async function deployDiff(unifiedSections: UnifiedSection[], firebaseRef: Firebase): Promise<void> {
    for (const section of nextLeafSection<UnifiedSection>(unifiedSections)) {
        const lineDiffs: LineDiff[] = await UnifiedSection.readLineDiffs(section);
        const sectionRef = firebaseRef.child(section.path);
        await sectionRef.set(lineDiffs);
    }
}
