'use strict'; // XXX
import * as path from 'path';
import * as parse5 from 'parse5';
import { readFile, writeFile, mkdirp, sha256, log } from '../utils';
import { readJSONEntry, writeJSONEntry, nextJSONEntry, JSONEntry } from '../jsonEntry';
import { filter } from '../filter';
import { formatFragment } from './formatter';

//
// Formatter
//
async function formatHTML(jsonEntry: JSONEntry, srcRoot: string, outRoot: string): Promise<any> {
    const srcPath = path.join(srcRoot, jsonEntry.path + '.html');

    let html = await readFile(srcPath);

    let fragmentNode = parse5.parseFragment(html);
    fragmentNode = filter(fragmentNode);
    html = formatFragment(fragmentNode);

    const outPath = path.join(outRoot, jsonEntry.path + '.html');
    await mkdirp(path.dirname(outPath));

    await writeFile(outPath, html);

    // compute hash
    jsonEntry.hash.formatted = sha256(html);
}


async function formatOrg(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    const jsonEntries = await readJSONEntry(srcRoot);

    for (const jsonEntry of nextJSONEntry(jsonEntries)) {
        await formatHTML(jsonEntry, srcRoot, outRoot);
    }

    await writeJSONEntry(outRoot, jsonEntries);
}

export async function format(): Promise<void> {
    log(['format', 'whatwg', 'start']);
    await formatOrg('whatwg');
    log(['format', 'whatwg', 'end']);

    log(['format', 'w3c', 'start']);
    await formatOrg('w3c');
    log(['format', 'w3c', 'end']);

}
