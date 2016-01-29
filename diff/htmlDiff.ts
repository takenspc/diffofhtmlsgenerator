'use strict';
import * as path from 'path';
import { DiffEntry } from './jsonDiff';
import { fork, ChildProcess } from 'child_process';
import { DiffEntry } from './';

export function diffDiffEntry(diffEntry: DiffEntry): Promise<any> {
    return new Promise((resolve, reject) => {
        const child = fork(path.join(__dirname, 'htmlDiffChild'));

        child.on('exit', () => {
            resolve();
        });
        
        child.on('error', (err) => {
            console.log(err);
            reject(err);
        })
        
        child.send(diffEntry);
    });
}

export function computeHTMLDiff(diffEntries: DiffEntry[]) {
    return Promise.all(diffEntries.map((diffEntry) => {
        return diffDiffEntry(diffEntry);
    }));
}