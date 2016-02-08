'use strict';
import * as path from 'path';
import { fork } from 'child_process';
import { DiffEntry, nextLeafDiffEntry } from '../diffEntry';

function runChildProcess(modulePath: string, section: DiffEntry) {
    return new Promise((resolve, reject) => {
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

export async function computeHTMLDiff(sections: DiffEntry[]): Promise<void> {
    const modulePath = path.join(__dirname, 'htmlDiffChild');
    for (const section of nextLeafDiffEntry(sections)) {
        await runChildProcess(modulePath, section);
    }
}
