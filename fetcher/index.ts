import * as fs from 'fs';
import * as https from 'https';
import * as log4js from 'log4js';
import * as path from 'path';
import { mkdirp, writeFile } from '../shared/utils';

function prepare(org: string) {
    const dirPath = path.join(__dirname, 'data', org);
    return mkdirp(dirPath).then(() => {
        return path.join(dirPath, 'index.html');
    });
}

function download(logger: log4js.Logger, org: string, url: string, htmlPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        logger.info(`fetch - ${org} - start`);

        // write stream
        const writeStream = fs.createWriteStream(htmlPath);

        writeStream.on('error', (err) => {
            logger.error(`fetch - ${org} - error`, err);
            reject(err);
        });

        writeStream.on('finish', () => {
            logger.info(`fetch - ${org} - end`);
            resolve();
        });

        // request
        const request = https.get(url, (res) => {
            logger.info(`fetch - ${org} - ${res.statusCode}`);

            res.on('data', (data) => {
                writeStream.write(data);
            });

            res.on('end', () => {
                writeStream.end();
            });
        });

        request.on('error', (err) => {
            logger.error(`fetch - ${org} - error`, err);
            reject(err);
        });
    });
}

function prepareThenDownload(logger: log4js.Logger, org: string, url: string): Promise<void> {
    return prepare(org).then((htmlPath) => {
        return download(logger, org, url, htmlPath);
    });
}

export function fetch(logger: log4js.Logger) {
    return Promise.all([
        prepareThenDownload(logger, 'whatwg', 'https://html.spec.whatwg.org/'),
        prepareThenDownload(logger, 'w3c', 'https://w3c.github.io/html/single-page.html'),
    ]).then(() => {
        const jsonPath = path.join(__dirname, 'data', 'fetch.json');
        const data = JSON.stringify({
            time: Date.now(),
        });
        return writeFile(jsonPath, data);
    });
}
