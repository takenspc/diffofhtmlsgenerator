'use strict';
import * as path from 'path';
import * as diff from 'diff';
import { writeFile, readFile, mkdirp, log } from '../utils';
import { DiffEntry } from '../diffEntry';

//
// Diff
//
export interface LineDiff {
    a: diff.IDiffResult[]
    b: diff.IDiffResult[]
}

function convertDiffResultsToLineDiffs(rawDiffs: diff.IDiffResult[]): LineDiff[] {
    const lines: LineDiff[] = [];

    let line: LineDiff = { a: [], b: [] };
    lines.push(line);

    for (const rawDiff of rawDiffs) {
        const values = rawDiff.value.split('\n');

        // NEED COMMENT
        for (let j = 0; j < values.length; j++) {
            // NEED COMMENT
            if (j > 0) {
                line = { a: [], b: [] };
                lines.push(line);
            }

            const hunk = {
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

function splitLineHunkIntoCharHunks(line: LineDiff, hunkA: diff.IDiffResult, hunkB: diff.IDiffResult): void {
    const rawDiffs = diff.diffChars(hunkA.value, hunkB.value, {
        ignoreWhitespace: true,
    });
    for (const rawDiff of rawDiffs) {
        const hunk = {
            value: rawDiff.value,
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

function splitLinesIntoChars(oldLines: LineDiff[]): LineDiff[] {
    const newLines: LineDiff[] = [];

    for (const oldLine of oldLines) {
        const newLine: LineDiff = { a: [], b: [] };
        newLines.push(newLine);

        const a = oldLine.a;
        const b = oldLine.b;
        const len = (a.length < b.length) ? b.length : a.length;

        // for each hunk of linediff
        for (let i = 0; i < len; i++) {
            // in case there are only b
            if (a.length <= i) {
                newLine.b.push(b[i]);
                continue;
            }

            // in case there are only a
            if (b.length <= i) {
                newLine.a.push(a[i]);
                continue;
            }

            // modified skip
            const hunkA = a[i];
            const hunkB = b[i];
            if (!hunkA.added && !hunkA.removed) {
                newLine.a.push(hunkA);
                newLine.b.push(hunkB);
                continue;
            }

            splitLineHunkIntoCharHunks(newLine, hunkA, hunkB);
        }
    }

    return newLines;
}

function computeDiff(a: string, b: string) {
    // XXX strip trailing spaces
    a = a.replace(/ +\n/g, '\n');
    b = b.replace(/ +\n/g, '\n');
    
    const rawDiffs = diff.diffLines(a, b, {
        newlineIsToken: true
    });

    let lines = convertDiffResultsToLineDiffs(rawDiffs);
    lines = splitLinesIntoChars(lines);

    return lines;
}


//
// Handle objects
//
export async function diffSection(section: DiffEntry): Promise<any> {
    const heading = section.headingText;
    log(['diff', heading, 'start']);
    const srcDir = path.join(__dirname, '..', 'formatter', 'data');
    const outDir = path.join(__dirname, 'data');

    let diffs: LineDiff[] = [];
    const htmlPath = section.path;
    const length = Math.max(section.w3c ? section.w3c.bufferListLength : 0, section.whatwg ? section.whatwg.bufferListLength : 0);
    for (var i = 0; i < length; i++) {
        const htmls = await Promise.all([
            readFile(path.join(srcDir, 'whatwg', htmlPath + '.' + i + '.html')),
            readFile(path.join(srcDir, 'w3c', htmlPath + '.' + i + '.html')),
        ]);
        diffs = diffs.concat(computeDiff(htmls[0].trim(), htmls[1].trim()));
    }

    const jsonPath = path.join(outDir, htmlPath + '.json');
    await mkdirp(path.dirname(jsonPath));
    await writeFile(jsonPath, JSON.stringify(diffs));
    log(['diff', heading, 'end']);
}

process.on('message', (section: DiffEntry) => {
    diffSection(section).then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        console.error(err.stack);
        process.exit(-1);
    });
});
