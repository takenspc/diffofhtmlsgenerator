import * as path from 'path';
import { readFile } from '../utils';
import { UnifiedSection, nextLeafUnifiedSection } from '../diffEntry';


//
// Diff Entry
//
async function deployUnifiedSection(srcRoot: string, section: UnifiedSection, firebaseRef: Firebase): Promise<void> {
    const sectionPath = section.path;

    const jsonPath = path.join(srcRoot, sectionPath + '.json');
    const jsonText = await readFile(jsonPath);
    const sectionDiff = JSON.parse(jsonText);

    const sectionRef = firebaseRef.child(sectionPath);
    await sectionRef.set(sectionDiff);
}

export async function deployDiff(srcRoot: string, unifiedSections: UnifiedSection[], firebaseRef: Firebase): Promise<void> {
    for (const section of nextLeafUnifiedSection(unifiedSections)) {
        await deployUnifiedSection(srcRoot, section, firebaseRef);
    }
}
