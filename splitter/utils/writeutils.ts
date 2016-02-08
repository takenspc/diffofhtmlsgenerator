'use strict';
import * as path from 'path';
import { writeFile, readFile, mkdirp, sha256, log } from '../../utils';
import { JSONEntry, writeJSONEntry } from '../../jsonEntry';
import { Document, getHTMLText } from './htmlutils';
import { Section, Spec } from './parserutils';

//
// Save spec data
//
function toJSONEntry(section: Section): JSONEntry {
    const sections = section.sections.map(toJSONEntry);

    const jsonEntry: JSONEntry = {
        id: section.id,
        path: section.path,
        headingText: section.headingText,
        originalHeadingText: section.originalHeadingText,
        sections: sections,
        hash: {
            splitted: section.hash,
            formatted: null,
        }
    };

    return jsonEntry;
}

async function saveHTML(rootPath: string, doc: Document, section: Section): Promise<any> {
    const htmlPath = path.join(rootPath, section.path + '.html');

    await mkdirp(path.dirname(htmlPath));

    const text = getHTMLText(doc, section.nodes);
    section.hash = sha256(text);
    await writeFile(htmlPath, text);
}

async function saveSection(rootPath: string, doc: Document, section: Section): Promise<void> {
    if (section.sections.length === 0) {
        await saveHTML(rootPath, doc, section);
        return;
    }

    for (const subSection of section.sections) {
        await saveSection(rootPath, doc, subSection);
    };
}

export async function saveSpec(rootPath: string, doc: Document, spec: Spec): Promise<void> {
    await saveSection(rootPath, doc, spec.section);

    const json = toJSONEntry(spec.section);
    await writeJSONEntry(rootPath, json.sections);
}
