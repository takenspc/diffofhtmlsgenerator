'use strict';
import * as path from 'path';
import * as diff from 'diff';
import { writeFile, readFile, mkdirp, log } from '../utils';
import { DiffEntry } from './';
import { diffDiffEntry } from './htmlDiff';

//
// Diff
//
interface LineDiff {
    a: diff.IDiffResult[]
    b: diff.IDiffResult[]
}

function splitDiffResultsIntoLines(rawDiffs: diff.IDiffResult[]) {
    let line: LineDiff = { a: [], b: [] };
    const lines: LineDiff[] = [line];

    for (let i = 0; i < rawDiffs.length; i++) {
        const rawDiff = rawDiffs[i];

        const values = rawDiff.value.split('\n');

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

    var lines = splitDiffResultsIntoLines(rawDiffs);

    return lines;
}


//
// Handle objects
//
async function diffChildren(sections: DiffEntry[]): Promise<any> {
    const srcDir = path.join(__dirname, '..', 'formatter', 'data');
    const outDir = path.join(__dirname, 'data');

    for (const section of sections) {
        // skip (diffGrandChildren handle this case)
        if (section.sections.length > 0) {
            continue;
        }
        
        const htmlPath = section.path;
        const htmls = await Promise.all([
            readFile(path.join(srcDir, 'whatwg', htmlPath + '.html')),
            readFile(path.join(srcDir, 'w3c', htmlPath + '.html')),
        ]);
        const diffs = computeDiff(htmls[0], htmls[1]);

        const jsonPath = path.join(outDir, htmlPath + '.json');
        await mkdirp(path.dirname(jsonPath));
        await writeFile(jsonPath, JSON.stringify(diffs));
    }
}


function diffGrandChildren(sections: DiffEntry[]): Promise<any> {
    return Promise.all(sections.map((section) => {
        if (section.sections.length > 0) {
            return diffDiffEntry(section);
        }

        return Promise.all([Promise.resolve()]);
    }));
}



//
// Entry point
//
process.on('message', (diffEntry: DiffEntry) => {
    const heading = diffEntry.heading;
    log(['start', heading]);

    Promise.all([
        // process children and grand children at the same time
        diffGrandChildren(diffEntry.sections),
        diffChildren(diffEntry.sections)
    ]).then(() => {
        log(['end', heading]);
        process.exit(0);
    }).catch((err) => {
        log(['error', heading]);
        console.error(heading, err);
        process.exit(0);
    });
});