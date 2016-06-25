import * as path from 'path';
import { fork } from 'child_process';
import { IDiffResult } from 'diff';
import { readFile } from '../utils';
import { DiffStat } from '../jsonEntry';
import { UnifiedSection, nextLeafUnifiedSection } from '../diffEntry';
import { LineDiff } from './htmlDiffChild';

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
    const diffPath = path.join(__dirname, 'data', section.path + '.json');
    const text = await readFile(diffPath);
    const lineDiffs = JSON.parse(text) as LineDiff[];

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
    for (const section of nextLeafUnifiedSection(sections)) {
        await runChildProcess(modulePath, section);
        await updateDiffStat(section);
    }
}
