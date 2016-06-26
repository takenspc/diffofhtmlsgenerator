import * as path from 'path';
import { fork } from 'child_process';
import { log } from '../shared/utils';

function runChildProcess(modulePath: string) {
    return new Promise((resolve, reject) => {
        const child = fork(modulePath);
        child.on('exit', () => {
            resolve();
        });

        child.on('error', (err) => {
            console.error(err);
            reject(err);
        });
    });
}


//
// Entry point
//
export async function split(): Promise<void> {
    log(['split', 'whatwg', 'start']);
    await runChildProcess(path.join(__dirname, 'whatwg'));
    log(['split', 'whatwg', 'end']);

    log(['split', 'w3c', 'start']);
    await runChildProcess(path.join(__dirname, 'w3c'));
    log(['split', 'w3c', 'end']);
}
