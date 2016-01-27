'use strict';
import * as path from 'path';
import * as diff from 'diff';
import * as mkdirp from 'mkdirp';
import { writeFile, readFile } from '../utils';
import { DiffEntry } from './jsonDiff';

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


async function computeSectionDiff(section: DiffEntry, srcDir: string, outDir: string) {

    const htmlPath = section.htmlPath;
    const htmls = await Promise.all([
        readFile(path.join(srcDir, 'whatwg', htmlPath)),
        readFile(path.join(srcDir, 'w3c', htmlPath)),
    ]);
    const diffs = computeDiff(htmls[0], htmls[1]);

    const jsonPath = path.join(outDir, htmlPath + '.json');
    mkdirp.sync(path.dirname(jsonPath));
    await writeFile(jsonPath, JSON.stringify(diffs));
}

async function main(chapter: DiffEntry) {
    console.log('start', new Date(), chapter.heading);

    const srcDir = path.join(__dirname, '..', 'formatter', 'data');
    const outDir = path.join(__dirname, 'data');

    for (const section of chapter.sections) {
        await computeSectionDiff(section, srcDir, outDir);
    };

    console.log('end', new Date(), chapter.heading);
}

process.on('message', main);