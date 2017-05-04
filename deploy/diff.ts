import * as admin from 'firebase-admin';
import * as path from 'path';
import { LineDiff } from '../diff/htmlDiffChild';
import { UnifiedSection } from '../diff/unifiedSection';
import { nextLeafSection } from '../shared/iterator';
import { readFile } from '../shared/utils';

//
// Diff Entry
//
export async function deployDiff(unifiedSections: UnifiedSection[], firebaseRef: admin.database.Reference): Promise<void> {
    for (const section of nextLeafSection<UnifiedSection>(unifiedSections)) {
        const lineDiffs: LineDiff[] = await UnifiedSection.readLineDiffs(section);
        const sectionRef = firebaseRef.child(section.path);
        await sectionRef.set(lineDiffs);
    }
}
