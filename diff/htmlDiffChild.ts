'use strict';
import * as path from 'path';
import * as diff from 'diff';
import * as mkdirp from 'mkdirp';
import { writeFile, readFile } from '../utils';
import { DiffEntry } from './jsonDiff';
import { diffDiffEntry } from './htmlDiff';

interface LineDiff {
    a: diff.IDiffResult[]
    b: diff.IDiffResult[]
}

function splitDiffIntoLines(rawDiffs: diff.IDiffResult[]) {

    var line: LineDiff = { a: [], b: [] };
    var lines: LineDiff[] = [line];

    for (var i = 0; i < rawDiffs.length; i++) {
        var rawDiff = rawDiffs[i];

        var values = rawDiff.value.split('\n');

        for (var j = 0; j < values.length; j++) {
            if (j > 0) {
                line = { a: [], b: [] };
                lines.push(line);
            }

            var hunk = {
                value: values[j],
                added: rawDiff.added,
                removed: rawDiff.removed,
            };

            if (hunk.removed || (!hunk.added && !hunk.removed)) {
                line.a.push(hunk);
            }

            if (hunk.added || (!hunk.added && !hunk.removed)) {
                line.b.push(hunk);
            }
        }

    }

    return lines;
}

function computeDiff(a: string, b: string) {
    var rawDiffs = diff.diffLines(a, b, {
        newlineIsToken: true
    });

    var lines = splitDiffIntoLines(rawDiffs);

    return lines;
}

function diffGrandChildren(sections: DiffEntry[]): Promise<any> {
    return Promise.all(sections.map((section) => {
        if (section.sections.length > 0) {
            return diffDiffEntry(section);
        }

        return Promise.all([]);
    }));
}

async function diffChildren(sections: DiffEntry[]): Promise<any> {
    const srcDir = path.join(__dirname, '..', 'formatter', 'data');
    const outDir = path.join(__dirname, 'data');

    for (const section of sections) {
        const htmlPath = section.path;
        const htmls = await Promise.all([
            readFile(path.join(srcDir, 'whatwg', htmlPath + '.html')),
            readFile(path.join(srcDir, 'w3c', htmlPath + '.html')),
        ]);
        const diffs = computeDiff(htmls[0], htmls[1]);

        const jsonPath = path.join(outDir, htmlPath + '.json');
        mkdirp.sync(path.dirname(jsonPath));
        await writeFile(jsonPath, JSON.stringify(diffs));
    }
}

async function main(diffEntry: DiffEntry) {
    console.log('start', new Date(), diffEntry.heading);

    await Promise.all([
        diffGrandChildren(diffEntry.sections),
        diffChildren(diffEntry.sections)
    ]);

    console.log('end', new Date(), diffEntry.heading);
    process.exit(0);
}

process.on('message', main);