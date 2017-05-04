import { fork } from 'child_process';
import * as log4js from 'log4js';
import * as path from 'path';

function runChildProcess(logger: log4js.Logger, modulePath: string, org: string) {
    return new Promise((resolve, reject) => {
        logger.info(`split - ${org} - start`);
        const child = fork(modulePath);
        child.on('exit', () => {
            logger.info(`split - ${org} - end`);
            resolve();
        });

        child.on('error', (err) => {
            logger.info(`split - ${org} - error`, err);
            reject(err);
        });
    });
}

//
// Entry point
//
export async function split(logger: log4js.Logger): Promise<void> {
    await runChildProcess(logger, path.join(__dirname, 'whatwg'), 'whatwg');

    await runChildProcess(logger, path.join(__dirname, 'w3c'), 'w3c');
}
