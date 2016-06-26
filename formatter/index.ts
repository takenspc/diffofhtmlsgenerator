import * as path from 'path';
import * as parse5 from 'parse5';
import { log } from '../utils';
import { SpecSection, nextLeafSpecSection } from '../jsonEntry';
import { filter } from '../filter';
import { formatFragment } from './formatter';


//
// Formatter
//
async function computeAndWriteFormattedHTML(specSection: SpecSection): Promise<void> {
    const originalHTML = await SpecSection.readOriginalHTML(specSection);

    let fragmentNode = parse5.parseFragment(originalHTML);
    fragmentNode = filter(fragmentNode);

    const formattedHTMLs = formatFragment(fragmentNode);
    for (let i = 0; i < formattedHTMLs.length; i++) {
        const formattedHTML = formattedHTMLs[i];
        await SpecSection.writeFormattedHTML(specSection, formattedHTML, i);
    }

    SpecSection.updateHash(specSection, originalHTML, formattedHTMLs);
}


async function formatOrg(org: string): Promise<void> {
    const specSections = await SpecSection.read(org);

    // writeFormattedHTML mutates specSection
    for (const specSection of nextLeafSpecSection(specSections)) {
        await computeAndWriteFormattedHTML(specSection);
    }

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
