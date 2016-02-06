'use strict'; // XXX
import * as fs from 'fs';
import * as path from 'path';
import { readFile, writeFile, mkdirp, sha256 } from '../utils';
import { JSONEntry, writeJSONEntry } from '../jsonEntry';
import { parse, Document } from './htmlutils';
import { Spec, Section } from './parserutils';
import * as whatwg from './whatwg';
import * as w3c from './w3c';


//
// Save spec data
//
function toJSONEntry(section: Section): JSONEntry {
    const sections = section.sections.map(toJSONEntry);

    const hash = section.text ? sha256(section.text) : null

    const jsonEntry: JSONEntry = {
        id: section.id,
        path: section.path,
        headingText: section.headingText,
        originalHeadingText: section.originalHeadingText,
        sections: sections,
        hash: {
            splitted: hash,
            formatted: null,
        }
    };

    return jsonEntry;
}

async function saveHTML(root: string, section: Section): Promise<any> {
    const htmlPath = path.join(root, section.path + '.html');
    const text = section.text;

    await mkdirp(path.dirname(htmlPath));

    await writeFile(htmlPath, text);
}

function saveSection(root: string, section: Section): Promise<any> {
    if (section.sections.length === 0) {
        return saveHTML(root, section);
    }

    return Promise.all(section.sections.map((subSection) => {
        return saveSection(root, subSection);
    }));
}

async function saveSpec(org: string, spec: Spec): Promise<any> {
    const root = path.join(__dirname, 'data', org);

    await saveSection(root, spec.section);

    const json = toJSONEntry(spec.section);
    await writeJSONEntry(root, json.sections);
}


//
// Parse and split spec
//
async function splitSpec(org: string, parser: (Document) => Spec): Promise<Spec> {
    const htmlPath = path.join(__dirname, '..', 'fetcher', 'data', org, 'index.html');
    const doc = await parse(htmlPath);
    const spec = parser(doc);

    return spec
}


//
// Entry point
//
function splitAndSaveSpec(org: string, parser: (Document) => Spec): Promise<any> {
    return splitSpec(org, parser).then((spec) => {
        return saveSpec(org, spec)
    });
}

export function split() {
    return Promise.all([
       splitAndSaveSpec('whatwg', whatwg.parseSpec),
       splitAndSaveSpec('w3c', w3c.parseSpec),
    ]);
}
