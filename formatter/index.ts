'use strict'; // XXX
import * as path from 'path';
import * as parse5 from 'parse5';
import { readFile, writeFile, mkdirp } from '../utils';
import { readJSONEntry, nextJSONEntry } from '../jsonEntry';
import { filter } from '../filter';
import { formatFragment } from './formatter';

//
// Formatter
//
async function formatHTML(relativePath: string, srcRoot: string, outRoot: string): Promise<any> {
    const srcPath = path.join(srcRoot, relativePath + '.html');
    
    const srcHTML = await readFile(srcPath);

    const fragmentNode = parse5.parseFragment(srcHTML);
    const filtered = filter(fragmentNode);
    const formatted = formatFragment(filtered);

    const outPath = path.join(outRoot, relativePath + '.html');
    await mkdirp(path.dirname(outPath));

    await writeFile(outPath, formatted);
}


async function formatOrg(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    const jsonEntries = await readJSONEntry(srcRoot);
    const relativePaths: string[] = [];
    for (const jsonEntry of nextJSONEntry(jsonEntries)) {
        relativePaths.push(jsonEntry.path);
    }

    await Promise.all(relativePaths.map((relativePath) => {
        return formatHTML(relativePath, srcRoot, outRoot);
    }))
}

export function format() {
    return Promise.all([
       formatOrg('whatwg'), 
       formatOrg('w3c'), 
    ]);
}
