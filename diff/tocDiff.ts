import { SpecSection } from '../formatter/specSection';
import { UnifiedSection } from './unifiedSection';

//
// Utils.
//
function compare(whatwg: SpecSection, w3c: SpecSection): boolean {
    const whatwgHeading = whatwg.headingText;
    const w3cHeading = w3c.headingText;

    if (whatwgHeading === w3cHeading) {
        return true;
    }

    return false;
}

/**
 * check whether `base` contains `target`
 * if so return `index` which satisfies `base[index] === target`
 */
function findIndexOfTargetEntry(target: SpecSection, base: SpecSection[], limit: number): number {
    const len = (limit < base.length) ? limit : base.length;

    for (let i = 0; i < len; i++) {
        if (compare(target, base[i])) {
            return i;
        }
    }

    return -1;
}

//
// Entry point
//
export function createUnifiedSections(whatwg: SpecSection[], w3c: SpecSection[]): UnifiedSection[] {
    const sectionPairs: SpecSection[][] = [];

    const whatwgRemains: SpecSection[] = [].concat(whatwg);
    const w3cRemains: SpecSection[] = [].concat(w3c);

    for (const whatwgSection of whatwgRemains) {
        let w3cSection = w3cRemains.shift();

        // if `whatwgEntry === w3cEntry`,
        // insert both `whatwgEntry` and ``w3cEntry`
        if (w3cSection && compare(whatwgSection, w3cSection)) {
            sectionPairs.push([whatwgSection, w3cSection]);
            continue;
        }

        // check whether `w3cRemains` contains `whatwgEntry`
        // in such caess, `index` satisfies `w3cRemains[index] === whatwgEntry`
        const index = findIndexOfTargetEntry(whatwgSection, w3cRemains, 8);
        if (index > -1) {
            // insert w3c only entries (`w3cRemains[-1]` ... `w3cRemains[index - 1]`)
            //
            // NOTE: `w3cRemains[-1]` means current `w3cEntry`
            //
            for (let i = -1; i < index; i++) {
                sectionPairs.push([null, w3cSection]);
                w3cSection = w3cRemains.shift();
            }

            // Now, `w3cEntry` is `w3cRemains[index]` (=== `whatwgEntry`)
            // insert whatwg entry and w3c entry
            //
            // NOTE: w3cRemains has been muted by calling shift,
            // `w3cEntry === w3cRemains[index]` returns false
            //
            sectionPairs.push([whatwgSection, w3cSection]);
            continue;
        }

        // insert whatwg only Entry
        sectionPairs.push([whatwgSection, null]);

        // push back w3cEntry
        if (w3cSection) {
            w3cRemains.unshift(w3cSection);
        }
    }

    // insert w3cEntry
    for (const w3cEntry of w3cRemains) {
        sectionPairs.push([null, w3cEntry]);
    }

    // process recursively
    const unifiedSections: UnifiedSection[] = [];
    for (const [whatwg, w3c] of sectionPairs) {
        const unifiedSection = new UnifiedSection(whatwg, w3c);
        unifiedSections.push(unifiedSection);

        const whatwgChildren = whatwg ? whatwg.sections : [];
        const w3cChildren = w3c ? w3c.sections : [];
        if (whatwgChildren.length > 0 || w3cChildren.length > 0) {
            unifiedSection.sections = createUnifiedSections(whatwgChildren, w3cChildren);
        }
    }

    return unifiedSections;
}
