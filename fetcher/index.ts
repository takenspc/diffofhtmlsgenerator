import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as mkdirp from 'mkdirp';
import { log, writeFile } from '../utils';

function download(org: string, url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        log(['fetch', org, 'start']);
        const dirPath = path.join(__dirname, 'data', org);
        mkdirp.sync(dirPath);

        // write stream
        const htmlPath = path.join(dirPath, 'index.html');
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

export function fetch() {
    return Promise.all([
        download('w3c', 'https://w3c.github.io/html/single-page.html'),
        download('whatwg', 'https://html.spec.whatwg.org/'),
    ]).then(() => {
        const jsonPath = path.join(__dirname, 'data', 'fetch.json');
        const data = JSON.stringify({
            time: Date.now(),
        });
        return writeFile(jsonPath, data);
    })
}