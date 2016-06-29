import * as path from 'path';
import { readFile, writeFile } from '../shared/utils';
import { nextLeafSection } from '../shared/iterator';
import { UnifiedSection, DiffStat, FlattedSpecSection } from '../diff/unifiedSection';


//
// Hash Data
//
interface HashSubEntry {
    splitted: string
    formatted: string
    diffStat: DiffStat
}

interface HashEntry {
    headingText: string
    whatwg: HashSubEntry
    w3c: HashSubEntry
}

interface HashData {
    paths: string[]
    path2HashEntry: Map<string, HashEntry>
}

function createHashSubEntry(specSection: FlattedSpecSection): HashSubEntry {
    if (!specSection) {
        return null;
    }

    const hashSubEntry: HashSubEntry = {
        splitted: specSection.hash.splitted,
        formatted: specSection.hash.formatted,
        diffStat: specSection.diffStat
    };

    return hashSubEntry;
}


function createHashData(unifiedSections: UnifiedSection[]): HashData {
    const paths: string[] = [];
    const path2HashEntry = new Map<string, HashEntry>();

    for (const unifiedSection of nextLeafSection<UnifiedSection>(unifiedSections)) {
        const path = unifiedSection.path;
        paths.push(path);

        const hashEntry: HashEntry = {
            headingText: unifiedSection.headingText,
            whatwg: createHashSubEntry(unifiedSection.whatwg),
            w3c: createHashSubEntry(unifiedSection.w3c),
        };
        path2HashEntry.set(path, hashEntry);
    }

    const hashData: HashData = {
        paths: paths,
        path2HashEntry: path2HashEntry
    };

    return hashData;
}


//
// Update Entry
//
interface UpdateSubEntry {
    splitted: string
    formatted: string
    diffStat: DiffStat
}

export interface UpdateEntry {
    path: string
    headingText: string
    whatwg: UpdateSubEntry
    w3c: UpdateSubEntry
}

function createUpdateSubEntry(splitted: string, formatted: string, diffStat: DiffStat): UpdateSubEntry {
    return {
        splitted: splitted,
        formatted: formatted,
        diffStat: diffStat,
    };
}

function compareHashSubEntry(oldHashSubEntry: HashSubEntry, newHashSubEntry: HashSubEntry): UpdateSubEntry {
    // not modified (not exist at all)
    if (!oldHashSubEntry && !newHashSubEntry) {
        return null;
    }
    
    // added
    if (!oldHashSubEntry) {
        return createUpdateSubEntry('added', 'added', newHashSubEntry.diffStat);
    }

    // removed
    if (!newHashSubEntry) {
        const diffStat: DiffStat = {
            diffCount: -oldHashSubEntry.diffStat.diffCount,
            total: -oldHashSubEntry.diffStat.total
        };
        return createUpdateSubEntry('removed', 'removed', diffStat);
    }

    // in case, newSubEntry && oldSubEntry
    const isSplittedUpdated = (oldHashSubEntry.splitted !== newHashSubEntry.splitted);
    const isFormattedUpdated = (oldHashSubEntry.formatted !== newHashSubEntry.formatted);

    const diffStat = {
        diffCount: newHashSubEntry.diffStat.diffCount - oldHashSubEntry.diffStat.diffCount,
        total: newHashSubEntry.diffStat.total - oldHashSubEntry.diffStat.total
    };

    if (isSplittedUpdated || isFormattedUpdated) {
        return createUpdateSubEntry(isSplittedUpdated ? 'modified' : '', isFormattedUpdated ? 'modified' : '', diffStat);
    }

    // not modified
    return null;
}

function createUpdateEntry(path: string, oldHash: HashEntry, newHash: HashEntry): UpdateEntry {
    // check modification
    const whatwg = compareHashSubEntry(oldHash ? oldHash.whatwg : null, newHash ? newHash.whatwg : null);
    const w3c = compareHashSubEntry(oldHash ? oldHash.w3c : null, newHash ? newHash.w3c : null);

    // not modified
    if (!whatwg && !w3c) {
        return null;
    }

    const headingText = (newHash) ? newHash.headingText : oldHash.headingText;

    const entry: UpdateEntry = {
        headingText: headingText,
        path: path,
        whatwg: whatwg,
        w3c: w3c,
    };
    return entry;
}


function createUpdateEntries(oldData: HashData, newData: HashData): UpdateEntry[] {
    const updateEntries: UpdateEntry[] = [];
    
    // added or modified
    for (const path of newData.paths) {
        const oldHash = oldData.path2HashEntry.get(path);
        const newHash = newData.path2HashEntry.get(path);

        const updateEntry = createUpdateEntry(path, oldHash, newHash)
        if (updateEntry) {
            updateEntries.push(updateEntry);
        }
    }
    
    // removed
    for (const path of oldData.paths) {
        const oldHash = oldData.path2HashEntry.get(path);
        const newHash = newData.path2HashEntry.get(path);
        
        // skip not removed
        if (newHash) {
            continue;
        }

        const updateEntry = createUpdateEntry(path, oldHash, newHash)
        if (updateEntry) {
            updateEntries.push(updateEntry);
        }
    }

    return updateEntries;
}

export async function update(oldUnifiedSections: UnifiedSection[], newUnifiedSections: UnifiedSection[]): Promise<UpdateEntry[]> {
    const oldData = createHashData(oldUnifiedSections);
    const newData = createHashData(newUnifiedSections);

    const updatedEntries = createUpdateEntries(oldData, newData);

    const jsonPath = path.join(__dirname, 'data', 'update.json');
    await writeFile(jsonPath, JSON.stringify(updatedEntries));

    return updatedEntries;
}
