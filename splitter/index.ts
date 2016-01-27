'use strict'; // XXX
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { parse, Document } from './htmlutils';
import { Spec, Section } from './parserutils';
import { readFile, writeFile } from '../utils';
import * as whatwg from './whatwg';
import * as w3c from './w3c';

function saveHTML(root: string, section: Section): Promise<any> {
    const htmlPath = path.join(root, section.path + '.html');
    const text = section.text;

    mkdirp.sync(path.dirname(htmlPath));

    return writeFile(htmlPath, text);
}


function saveSection(root: string, section: Section): Promise<any> {
    if (section.sections.length === 0) {
        return saveHTML(root, section);
    }
    
    return Promise.all(section.sections.map((subSection) => {
        return saveSection(root, subSection);
    }));
}


export interface JSONEntry {
    id: string
    heading: string
    path: string
    sections: JSONEntry[]
}

function saveJSON(root: string, json: JSONEntry[]): Promise<any> {
    const jsonPath = path.join(root, 'index.json');
    const text = JSON.stringify(json);

    return writeFile(jsonPath, text);
}

function getJSONData(section: Section): JSONEntry {
    const sections = section.sections.map(getJSONData);
    
    return {
        id: section.id,
        heading: section.heading,
        path: section.path,
        sections: sections,
    };
}


async function saveSpec(org: string, parser: (Document) => Spec) {
    const htmlPath = path.join(__dirname, '..', 'fetcher', 'data', org, 'index.html');
    const doc = await parse(htmlPath);
    const spec = parser(doc);


    const root = path.join(__dirname, 'data', org);
    
    // const header = spec.header;
    //mkdirp.sync(path.join(root, '__header__'));
    //await saveHTML(root, '__header__', '__header__', header.text);


    await saveSection(root, spec.section);

    const json = getJSONData(spec.section);
    await saveJSON(root, json.sections);
}

export function split() {
    return Promise.all([
       saveSpec('whatwg', whatwg.parseSpec), 
       saveSpec('w3c', w3c.parseSpec), 
    ]);
}
