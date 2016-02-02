'use strict';
import * as path from 'path';
import { fork, ChildProcess } from 'child_process';
import { DiffEntry } from './';

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
            console.log(err);
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
    
    for (const section of sections) {
        if (section.sections.length === 0) {
            collected.push(section);
        } else {
            collected = collected.concat(collectSections(section.sections));
        }
    }
    
    return collected;
}


export function computeHTMLDiff(sections: DiffEntry[]): Promise<any> {
    const collected: DiffEntry[] = collectSections(sections);
    
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 4; i++) {
        promises.push(diffChildProcess(collected));
    }

    return Promise.all(promises);
}