import { fork } from 'child_process';
import { IDiffResult } from 'diff';
import * as log4js from 'log4js';
import * as path from 'path';
import { nextLeafSection } from '../shared/iterator';
import { DiffStat, UnifiedSection } from './unifiedSection';

function runChildProcess(logger: log4js.Logger, modulePath: string, section: UnifiedSection): Promise<void> {
    const headingText = section.headingText;

    return new Promise<void>((resolve, reject) => {
        logger.info(`diff - ${headingText} - start`);
        const child = fork(modulePath);
        child.on('exit', () => {
            logger.info(`diff - ${headingText} - end`);
            resolve();
        });

        child.on('error', (err) => {
            logger.error(`diff - ${headingText} - error`, err);
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

export async function computeHTMLDiff(logger: log4js.Logger, sections: UnifiedSection[]): Promise<void> {
    const modulePath = path.join(__dirname, 'htmlDiffChild');
    for (const section of nextLeafSection<UnifiedSection>(sections)) {
        await runChildProcess(logger, modulePath, section);
        await updateDiffStat(section);
    }
}
