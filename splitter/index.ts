'use strict'; // XXX
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { parse, Document } from './htmlutils';
import { Spec } from './parserutils';
import * as whatwg from './whatwg';
import * as w3c from './w3c';

function ntfsSafe(value: string): string {
    // https://support.microsoft.com/kb/100108
    const ntfsUnsafe = /[?"/\<>*|:]/g;
    return value.replace(ntfsUnsafe, '_');
}

function save(root: string, chapterId: string, sectionId: string, text: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const relativePath = path.join(ntfsSafe(chapterId), ntfsSafe(sectionId + '.html'));        
        const htmlPath = path.join(root, relativePath);
        fs.writeFile(htmlPath, text, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(relativePath);
        })
    });
}

interface JSONEntry {
    id: string
    heading: string
    htmlPath: string
    sessions: JSONEntry[]
}

function saveJSON(root: string, json: JSONEntry[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const jsonPath = path.join(root, 'index.json');

        fs.writeFile(jsonPath, JSON.stringify(json), (err) => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

async function saveSpec(org: string, parser: (Document) => Spec) {
    const htmlPath = path.join(__dirname, '..', 'fetcher', 'data', org, 'index.html');
    const doc = await parse(htmlPath);
    const spec = parser(doc);


    const root = path.join(__dirname, 'data', org);
    const header = spec.header;
    mkdirp.sync(path.join(root, '__header__'));
    await save(root, '__header__', '__header__', header.text);

    const json: JSONEntry[] = []

    for (const chapter of spec.chapters) {
        const chapterHeadingText = chapter.heading;
        mkdirp.sync(path.join(root, chapterHeadingText));
        
        const sections = chapter.sections;
        const htmlPaths = await Promise.all(sections.map((section) => {
            return save(root, chapterHeadingText, section.heading, section.text);
        }));

        const jsonSessions: JSONEntry[] = sections.map((section, i) => {
            return {
                id: section.id,
                heading: section.heading,
                htmlPath: htmlPaths[i],
                sessions: null,
            };
        });

        const jsonChapter: JSONEntry = {
            id: chapter.id,
            heading: chapter.heading,
            htmlPath: null,
            sessions: jsonSessions,
        };

        json.push(jsonChapter);
    }

    await saveJSON(root, json);
}

export function split() {
    return Promise.all([
       saveSpec('whatwg', whatwg.parseSpec), 
       saveSpec('w3c', w3c.parseSpec), 
    ]);
}
