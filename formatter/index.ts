'use strict'; // XXX
import * as path from 'path';
import * as parse5 from 'parse5';
import { readFile, writeFile, mkdirp, sha256 } from '../utils';
import { readJSONEntry, writeJSONEntry, nextJSONEntry, JSONEntry } from '../jsonEntry';
import { filter } from '../filter';
import { formatFragment } from './formatter';

//
// Formatter
//
async function formatHTML(jsonEntry: JSONEntry, srcRoot: string, outRoot: string): Promise<any> {
    const srcPath = path.join(srcRoot, jsonEntry.path + '.html');

    const srcHTML = await readFile(srcPath);

    const fragmentNode = parse5.parseFragment(srcHTML);
    const filtered = filter(fragmentNode);
    const formatted = formatFragment(filtered);

    const outPath = path.join(outRoot, jsonEntry.path + '.html');
    await mkdirp(path.dirname(outPath));

    await writeFile(outPath, formatted);

    // compute hash
    jsonEntry.hash.formatted = sha256(formatted);
}


async function formatOrg(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    const jsonEntries = await readJSONEntry(srcRoot);
    const leafJSONEntries: JSONEntry[] = [];
    for (const jsonEntry of nextJSONEntry(jsonEntries)) {
        leafJSONEntries.push(jsonEntry);
    }

    // TO MAKE HEROKU HAPPY, DO NOT USE Promise.all HERE
    for (const jsonEntry of leafJSONEntries) {
        await formatHTML(jsonEntry, srcRoot, outRoot);
    }

    await writeJSONEntry(outRoot, jsonEntries);
}

export async function format(): Promise<void> {
    // TO MAKE HEROKU HAPPY, DO NOT USE Promise.all HERE
    await formatOrg('whatwg');
    await formatOrg('w3c');
}
