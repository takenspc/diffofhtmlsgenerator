import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { log, mkdirp, writeFile } from '../shared/utils';

function prepare(org: string) {
    const dirPath = path.join(__dirname, 'data', org);
    return mkdirp(dirPath).then(() => {
        return path.join(dirPath, 'index.html');
    });
}

function download(org: string, url: string, htmlPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        log(['fetch', org, 'start']);

        // write stream
        const writeStream = fs.createWriteStream(htmlPath);

        writeStream.on('error', (err) => {
            log(['error', org]);
            console.error(org, err);
            reject(err);
        });

        writeStream.on('finish', () => {
            log(['fetch', org, 'end']);
            resolve();
        });

        // request
        const request = https.get(url, (res) => {
            log(['fetch', org, res.statusCode]);

            res.on('data', (data) => {
                writeStream.write(data);
            });

            res.on('end', () => {
                writeStream.end();
            });
        });

        request.on('error', (err) => {
            log(['error', org]);
            console.error(org, err);
            reject(err);
        });
    });
}

function prepareThenDownload(org: string, url: string): Promise<void> {
    return prepare(org).then((htmlPath) => {
        return download(org, url, htmlPath);
    })
}

export function fetch() {
    return Promise.all([
        prepareThenDownload('whatwg', 'https://html.spec.whatwg.org/'),
        prepareThenDownload('w3c', 'https://w3c.github.io/html/single-page.html')
    ]).then(() => {
        const jsonPath = path.join(__dirname, 'data', 'fetch.json');
        const data = JSON.stringify({
            time: Date.now(),
        });
        return writeFile(jsonPath, data);
    })
}