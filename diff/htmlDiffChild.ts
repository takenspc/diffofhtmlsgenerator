import * as assert from 'assert';
import * as diff from 'diff';
import * as path from 'path';
import { UnifiedSection } from './unifiedSection';

//
// Diff
//
export interface LineDiff {
    a: diff.IDiffResult[];
    b: diff.IDiffResult[];
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
                added,
                removed,
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
        newlineIsToken: true,
    });

    const lineDiff = convertDiffResultsToLineDiff(rawDiffs);
    const wordDiff = splitLinesIntoWordDiffs(lineDiff);

    return wordDiff;
}

//
// Handle objects
//
async function diffSection(section: UnifiedSection): Promise<void> {
    let lineDiffs: LineDiff[] = [];
    const length = section.formattedHTMLsLength;
    for (let i = 0; i < length; i++) {
        const [whatwg, w3c] = await UnifiedSection.readHTMLs(section, i);
        lineDiffs = lineDiffs.concat(computeDiff(whatwg.trim(), w3c.trim()));
    }

    await UnifiedSection.writeLineDiffs(section, lineDiffs);
}

process.on('message', (section: UnifiedSection) => {
    diffSection(section).then(() => {
        process.disconnect();
    }).catch((err) => {
        throw err;
    });
});
