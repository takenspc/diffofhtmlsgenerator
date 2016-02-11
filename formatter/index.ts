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
export class BufferList {
    bufferList: string[]
    buffer: string[];

    constructor() {
        this.bufferList = [];
        this.createNextBuffer();
    }
    
    
    createNextBuffer(): void {
        this.flush();
        this.buffer = [];
    }
    
    flush(): void {
        if (this.buffer) {
            this.bufferList.push(this.buffer.join(''));
        }
    }
    
    write(text: string): void {
        this.buffer.push(text);
    }
}

async function formatHTML(jsonEntry: JSONEntry, srcRoot: string, outRoot: string): Promise<void> {
    const srcPath = path.join(srcRoot, jsonEntry.path + '.html');

    let html = await readFile(srcPath);

    let fragmentNode = parse5.parseFragment(html);
    fragmentNode = filter(fragmentNode);

    const bufferList = new BufferList();
    formatFragment(bufferList, fragmentNode);
    bufferList.flush();

    html = '';
    const bufferListLength = bufferList.bufferList.length;
    for (let i = 0; i < bufferListLength; i++) {
        const outPath = path.join(outRoot, jsonEntry.path + '.' + i + '.html');
        await mkdirp(path.dirname(outPath));

        const text = bufferList.bufferList[i];
        await writeFile(outPath, text);

        html += text;
    }

    // compute hash
    jsonEntry.hash.formatted = sha256(html);
    jsonEntry.bufferListLength = bufferListLength;
}


async function formatOrg(org: string) {
    const srcRoot = path.join(__dirname, '..', 'splitter', 'data', org);
    const outRoot = path.join(__dirname, 'data', org);

    const jsonEntries = await readJSONEntry(srcRoot);

    // formatHTML mutates jsonEntries
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
