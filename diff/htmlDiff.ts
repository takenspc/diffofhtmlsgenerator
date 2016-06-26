import * as path from 'path';
import { fork } from 'child_process';
import { IDiffResult } from 'diff';
import { nextLeafSection } from '../shared/iterator';
import { UnifiedSection, DiffStat } from './unifiedSection';


function runChildProcess(modulePath: string, section: UnifiedSection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const child = fork(modulePath);
        child.on('exit', () => {
            resolve();
        });

        child.on('error', (err) => {
            console.error(err);
            reject(err);
        });

        child.send(section);
    });
}

function updateDiffCount(diffStat: DiffStat, diffs: IDiffResult[]): void {
    for (const diff of diffs) {
        const length = diff.value.length;
        if (diff.removed || diff.added) {
            diffStat.diffCount += length;
        }
        diffStat.total += length;
    }
}

async function updateDiffStat(section: UnifiedSection): Promise<void> {
    const lineDiffs = await UnifiedSection.readLineDiffs(section);

    for (const lineDiff of lineDiffs) {
        if (section.whatwg) {
            updateDiffCount(section.whatwg.diffStat, lineDiff.a);
        }

        if (section.w3c) {
            updateDiffCount(section.w3c.diffStat, lineDiff.b);
        }
    }

}

export async function computeHTMLDiff(sections: UnifiedSection[]): Promise<void> {
    const modulePath = path.join(__dirname, 'htmlDiffChild');
    for (const section of nextLeafSection<UnifiedSection>(sections)) {
        await runChildProcess(modulePath, section);
        await updateDiffStat(section);
    }
}
