import * as assert from 'assert';
import * as path from 'path';
import { SpecSection } from '../jsonEntry';
import { UnifiedSection } from '../diffEntry';
import { createUnifiedSections } from './jsonDiff';
import { computeHTMLDiff } from './htmlDiff';

/**
 * move targetId section before referenceId
 */
function moveEntryBefore(sections: SpecSection[], targetId: string, referenceId: string): SpecSection[] {
    const tmp: SpecSection[] = [];
    let target: SpecSection = null;
    let reference: SpecSection = null;
    for (const section of sections) {
        const id = section.id;
        if (section.id === targetId) {
            target = section;
            continue;
        }

        tmp.push(section);

        if (section.id === referenceId) {
            reference = section;
        }
    }
    assert(target, `There must be #${targetId} section`);
    if (referenceId) {
        assert(reference, `There must be #${referenceId} section`);
    }

    let reorderd: SpecSection[]= [];
    if (referenceId) {
        for (const section of tmp) {
            if (section === reference) {
                reorderd.push(target);
            }

            reorderd.push(section);
        }
    } else {
        reorderd = tmp.concat([target]);
    }

    return reorderd;
}

function getEntryById(sections: SpecSection[], id: string): SpecSection {
    for (const section of sections) {
        if (section.id === id) {
            return section;
        }
    }

    for (const section of sections) {
        const child = getEntryById(section.sections, id);
        if (child) {
            return child;
        }
    }

    return null;
}

function reoderW3C(sections: SpecSection[]): void {
    // 4 The elements of HTML
    const semantics = getEntryById(sections, 'semantics');
    assert(semantics, 'w3c entries must have #semantics section');
    // Move 'Links' before 'Edits'
    semantics.sections = moveEntryBefore(semantics.sections, 'links', 'edits');
    
    // Embedded content
    const embedded = getEntryById(sections, 'semantics-embedded-content');
    assert(embedded, 'w3c entries must have #semantics-embedded-content section');
    // Move 'The source element' before 'The source element when used with the picture element'
    embedded.sections = moveEntryBefore(embedded.sections, 'the-source-element', 'the-source-element-when-used-with-the-picture-element');
}


//
// Entry point
//
export async function diff(): Promise<void> {
    const [whatwg, w3c] = await Promise.all([
        SpecSection.read('whatwg'),
        SpecSection.read('w3c'),
    ]);

    // reorder 
    reoderW3C(w3c);

    const unifiedSections = createUnifiedSections(whatwg, w3c);

    // computeHTMLDiff mutates unifiedSections
    await computeHTMLDiff(unifiedSections);

    await UnifiedSection.write(unifiedSections);
}
