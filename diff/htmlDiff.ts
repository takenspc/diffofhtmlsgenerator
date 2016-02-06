'use strict';
import * as path from 'path';
import { fork, ChildProcess } from 'child_process';
import { DiffEntry, nextLeafDiffEntry } from '../diffEntry';

export interface Message {
    type: string
    section: DiffEntry
}


function queue(child: ChildProcess, sections: DiffEntry[]) {
    const section = sections.pop();
    if (section) {
        child.send({
            type: 'diff',
            section: section,
        });
    } else {
        child.send({
            type: 'exit',
            section: null,
        });
    }
}

function diffChildProcess(sections: DiffEntry[]) {
    return new Promise((resolve, reject) => {
        const child = fork(path.join(__dirname, 'htmlDiffChild'));
        child.on('exit', () => {
            resolve();
        });

        child.on('error', (err) => {
            console.error(err);
            reject(err);
        });

        child.on('message', (message: Message) => {
            if (message.type === 'finish') {
                queue(child, sections);
            }
        });

        queue(child, sections);
    });
}

function collectSections(sections: DiffEntry[]): DiffEntry[] {
    let collected = [];
    
    for (const section of nextLeafDiffEntry(sections)) {
        collected.push(section);
    }
    
    return collected;
}


export function computeHTMLDiff(sections: DiffEntry[]): Promise<any> {
    const collected: DiffEntry[] = collectSections(sections);
    
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 8; i++) {
        promises.push(diffChildProcess(collected));
    }

    return Promise.all(promises);
}