import * as path from 'path';
import * as parse5 from 'parse5';
import { log, sha256 } from '../shared/utils';
import { Section } from '../splitter/section';
import { filter } from '../filter';
import { formatFragment } from './formatter';
import { SpecSection, HashStat } from './specSection';


//
// Formatter
//
async function createLeafSpecSection(section: Section): Promise<SpecSection> {
    const originalHTML = await Section.readSplittedHTML(section);
    const splittedHash = sha256(originalHTML);

    let fragmentNode = parse5.parseFragment(originalHTML);
    fragmentNode = filter(fragmentNode);
    const formattedHTMLs = formatFragment(fragmentNode);
    const formattedHash = sha256(formattedHTMLs.join(''));

    const hash: HashStat = {
        splitted: splittedHash,
        formatted: formattedHash
    };
    const formattedHTMLsLength = formattedHTMLs.length;
    const specSection = new SpecSection(section, hash, formattedHTMLsLength );

    for (let i = 0; i < formattedHTMLsLength; i++) {
        const formattedHTML = formattedHTMLs[i];
        await SpecSection.writeFormattedHTML(specSection, formattedHTML, i);
    }

    return specSection;
}


async function createSpecSection(section: Section): Promise<SpecSection> {
    if (section.sections.length === 0) {
        return await createLeafSpecSection(section);
    }

    const specSection = new SpecSection(section, null, 0);
    for (const childSection of section.sections) {
        const childSpecSection = await createSpecSection(childSection);
        specSection.sections.push(childSpecSection);
    }

    return specSection;
}


async function formatOrg(org: string): Promise<void> {
    const sections = await Section.read(org);

    const specSections: SpecSection[] = [];
    for (const section of sections) {
        const specSection = await createSpecSection(section);
        specSections.push(specSection);
    };

    await SpecSection.write(org, specSections);
}

export async function format(): Promise<void> {
    log(['format', 'whatwg', 'start']);
    await formatOrg('whatwg');
    log(['format', 'whatwg', 'end']);

    log(['format', 'w3c', 'start']);
    await formatOrg('w3c');
    log(['format', 'w3c', 'end']);

}
