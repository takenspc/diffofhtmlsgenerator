import * as assert from 'assert';
import * as log4js from 'log4js';
import * as path from 'path';
import { SpecSection } from '../formatter/specSection';
import { computeHTMLDiff } from './htmlDiff';
import { createUnifiedSections } from './tocDiff';
import { UnifiedSection } from './unifiedSection';

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

    let reorderd: SpecSection[] = [];
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
}

//
// Entry point
//
export async function diff(logger: log4js.Logger): Promise<void> {
    const [whatwg, w3c] = await Promise.all([
        SpecSection.read('whatwg'),
        SpecSection.read('w3c'),
    ]);

    // reorder
    reoderW3C(w3c);

    const unifiedSections = createUnifiedSections(whatwg, w3c);

    // computeHTMLDiff mutates unifiedSections
    await computeHTMLDiff(logger, unifiedSections);

    await UnifiedSection.write(unifiedSections);
}
