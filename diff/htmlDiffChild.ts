import * as assert from 'assert';
import * as path from 'path';
import * as diff from 'diff';
import { writeFile, readFile, mkdirp, log } from '../utils';
import { JSONEntry } from '../jsonEntry';
import { DiffEntry } from '../diffEntry';


//
// Diff
//
export interface LineDiff {
    a: diff.IDiffResult[]
    b: diff.IDiffResult[]
}

function insertEmptyLinesIfNeeded(lineDiff: LineDiff): void {
    const a = lineDiff.a;
    const b = lineDiff.b;

    while (a.length < b.length) {
        a.push({ value: '', removed: true });
    }

    while (b.length < a.length) {
        b.push({ value: '', added: true });
    }
}

function convertDiffResultsToLineDiff(rawDiffs: diff.IDiffResult[]): LineDiff {
    const lineDiff: LineDiff = {
        a: [],
        b: [],
    };

    for (const rawDiff of rawDiffs) {
        const lines = rawDiff.value.split('\n');

        // remove empty line
        if (rawDiff.value.startsWith('\n')) {
            lines.shift();
        }
        if (rawDiff.value.endsWith('\n')) {
            lines.pop();
        }

        const added = rawDiff.added;
        const removed = rawDiff.removed;
        const isLineSame = !added && !removed;

        if (isLineSame) {
            insertEmptyLinesIfNeeded(lineDiff);
        }

        for (const line of lines) {
            const hunk = {
                value: line,
                added: added,
                removed: removed,
            };

            if (hunk.removed || isLineSame) {
                lineDiff.a.push(hunk);
            }

            if (hunk.added || isLineSame) {
                lineDiff.b.push(hunk);
            }
        }
    }

    insertEmptyLinesIfNeeded(lineDiff);
    assert.strictEqual(lineDiff.a.length, lineDiff.b.length, 'lineDiff must have same number of lines');

    return lineDiff;
}

function splitLineIntoWordDiffs(wordDiff: LineDiff, lineA: string, lineB: string): void {
    const rawDiffs = diff.diffWords(lineA, lineB);
    for (const rawDiff of rawDiffs) {
        const hunk = {
            value: rawDiff.value,
            added: rawDiff.added,
            removed: rawDiff.removed,
        };

        if (hunk.removed || (!hunk.added && !hunk.removed)) {
            wordDiff.a.push(hunk);
        }

        if (hunk.added || (!hunk.added && !hunk.removed)) {
            wordDiff.b.push(hunk);
        }
    }
}

function splitLinesIntoWordDiffs(lineDiff: LineDiff): LineDiff[] {
    const wordDiffs: LineDiff[] = [];
    
    const a = lineDiff.a;
    const b = lineDiff.b;

    for (let i = 0; i < a.length; i++) {
        const wordDiff: LineDiff = { a: [], b: [] };
        wordDiffs.push(wordDiff);

        const lineHunkA = a[i];
        const lineHunkB = b[i];
        
        // in case, the line is same
        if (!lineHunkA.removed && !lineHunkB.added) {
            wordDiff.a.push(lineHunkA);
            wordDiff.b.push(lineHunkB);
            continue;
        }

        // the line is not same
        splitLineIntoWordDiffs(wordDiff, lineHunkA.value, lineHunkB.value);
    }

    return wordDiffs;
}

function computeDiff(a: string, b: string): LineDiff[] {
    // XXX strip trailing spaces
    a = a.replace(/ +\n/g, '\n');
    b = b.replace(/ +\n/g, '\n');
    
    const rawDiffs = diff.diffLines(a, b, {
        newlineIsToken: true
    });

    const lineDiff = convertDiffResultsToLineDiff(rawDiffs);
    const wordDiff = splitLinesIntoWordDiffs(lineDiff);

    return wordDiff;
}

function readFileIfExists(section: DiffEntry, org: string, srcDir: string, index: number): Promise<string> {
    const jsonEntry = (org === 'whatwg') ? section.whatwg : section.w3c;
    if (!jsonEntry || jsonEntry.bufferListLength <= index) {
        return Promise.resolve('');
    }

    const htmlPath = path.join(srcDir, org, section.path + '.' + index + '.html');
    return readFile(htmlPath);
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
    const length = Math.max(section.w3c ? section.w3c.bufferListLength : 0, section.whatwg ? section.whatwg.bufferListLength : 0);

    for (var i = 0; i < length; i++) {
        const [whatwg, w3c] = await Promise.all([
            readFileIfExists(section, 'whatwg', srcDir, i),
            readFileIfExists(section, 'w3c', srcDir, i),
        ]);
        diffs = diffs.concat(computeDiff(whatwg.trim(), w3c.trim()));
    }

    const jsonPath = path.join(outDir, section.path + '.json');
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
