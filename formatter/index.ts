'use strict'; // XXX
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as parse5 from 'parse5';
import { readJSONEntry, nextJSONEntry } from '../jsonEntry';
import { formatFragment } from './formatter';
import { readFile, writeFile } from '../utils';

//
// Formatter
//
async function formatHTML(relativePath: string, srcRoot: string, outRoot: string): Promise<any> {
    const srcPath = path.join(srcRoot, relativePath);
    
    const srcHTML = await readFile(srcPath);

    const fragmentNode = parse5.parseFragment(srcHTML);
    const formatted = formatFragment(fragmentNode);

    const outPath = path.join(outRoot, relativePath);
    mkdirp.sync(path.dirname(outPath));

    await writeFile(outPath, formatted);
}


async function formatDir(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    const jsonEntries = await readJSONEntry(srcRoot);
    const relativePaths: string[] = [];
    for (const jsonEntry of nextJSONEntry(jsonEntries)) {
        relativePaths.push(jsonEntry.path + '.html');
    }

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
