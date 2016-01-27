'use strict';
import * as path from 'path';
import { DiffEntry } from './jsonDiff';
import { fork, ChildProcess } from 'child_process';

export function computeHTMLDiff(chapters: DiffEntry[]) {
    console.log('start');
    const children = new Set<ChildProcess>();
    for (const chapter of chapters) {
        const child = fork(path.join(__dirname, 'htmlDiffChild'));
        child.send(chapter);
        children.add(child);
    }
    console.log('done');
}