'use strict'; // XXX
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as request from 'request';

function download(org: string, url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const dirPath = path.join(__dirname, 'data', org);
        mkdirp.sync(dirPath);

        const htmlPath = path.join(dirPath, 'index.html');
        const writeStream = fs.createWriteStream(htmlPath);

        writeStream.on('error', (err) => {
            reject(err);
        });
        
        writeStream.on('finish', () => {
            resolve();
        });

        request(url).pipe(writeStream);
    });
}

export function fetch() {
    return Promise.all([
        download('w3c', 'https://w3c.github.io/html/single-page.html'),
        download('whatwg', 'https://html.spec.whatwg.org/'),
    ])
}