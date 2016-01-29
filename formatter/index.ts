'use strict'; // XXX
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as parse5 from 'parse5';
import { formatFragment } from './formatter';

//
// Formatter
//
function formatHTML(relativePath: string, srcRoot: string, outRoot: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const srcPath = path.join(srcRoot, relativePath);
        fs.readFile(srcPath, 'utf-8', (err, html) => {
            if (err) {
                reject(err);
                return;
            }

            const fragmentNode = parse5.parseFragment(html);
            const formatted = formatFragment(fragmentNode);

            const outPath = path.join(outRoot, relativePath);
            mkdirp.sync(path.dirname(outPath));

            fs.writeFile(outPath, formatted, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    });
}

async function formatDir(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    // XXX
    // await copyJSON(srcRoot, outRoot);

    const relativePaths = await globHTML(srcRoot);

    await Promise.all(relativePaths.map((relativePath) => {
        return formatHTML(relativePath, srcRoot, outRoot);
    }))
}

export function format() {
    return Promise.all([
       formatDir('whatwg'), 
       formatDir('w3c'), 
    ]);
}


//
// Utils
//
function globHTML(cwd: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        glob('**/*.html', { cwd: cwd }, (err, matches) => {
            if (err) {
                reject;
                return;
            }

            resolve(matches);
        });
    });
}

/*
function copyJSON(srcRoot: string, outRoot: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const srcJSON = path.join(srcRoot, 'index.json');
        const readStream = fs.createReadStream(srcJSON);

        readStream.on('error', (err) => {
            reject(err);
        });

        const outJSON = path.join(outRoot, 'index.json');
        const writeStream = fs.createWriteStream(outJSON);
        
        writeStream.on('finish', () => {
            resolve();
        });

        writeStream.on('error', (err) => {
            reject(err);
        });
        
        readStream.pipe(writeStream);
    });
}
*/