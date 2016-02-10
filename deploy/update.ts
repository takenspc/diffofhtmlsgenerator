'use strict'; // XXX
import * as path from 'path';
import { readFile, writeFile, mkdirp } from '../utils';
import { JSONEntry, DiffStat } from '../jsonEntry';
import { DiffEntry, nextLeafDiffEntry } from '../diffEntry';


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

function createHashSubEntry(jsonEntry: JSONEntry): HashSubEntry {
    if (!jsonEntry) {
        return null;
    }

    const hashSubEntry: HashSubEntry = {
        splitted: jsonEntry.hash.splitted,
        formatted: jsonEntry.hash.formatted,
        diffStat: jsonEntry.diffStat
    };

    return hashSubEntry;
}


function createHashData(diffEntries: DiffEntry[]): HashData {
    const paths: string[] = [];
    const path2HashEntry = new Map<string, HashEntry>();

    for (const diffEntry of nextLeafDiffEntry(diffEntries)) {
        const path = diffEntry.path;
        paths.push(path);

        const hashEntry: HashEntry = {
            headingText: diffEntry.headingText,
            whatwg: createHashSubEntry(diffEntry.whatwg),
            w3c: createHashSubEntry(diffEntry.w3c),
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
}

interface UpdateEntry {
    path: string
    headingText: string
    whatwg: UpdateSubEntry
    w3c: UpdateSubEntry
    diffStats: string
}

function createUpdateSubEntry(splitted: string, formatted: string): UpdateSubEntry {
    return {
        splitted: splitted,
        formatted: formatted,
    };
}

function compareSubEntry(oldSubEntry: HashSubEntry, newSubEntry: HashSubEntry): UpdateSubEntry {
    // not modified (not exist at all)
    if (!oldSubEntry && !newSubEntry) {
        return null;
    }
    
    // added
    if (!oldSubEntry) {
        return createUpdateSubEntry('added', 'added');
    }

    // removed
    if (!newSubEntry) {
        return createUpdateSubEntry('removed', 'removed');
    }

    // in case, newSubEntry && oldSubEntry
    const splittedModified = (oldSubEntry.splitted !== newSubEntry.splitted);
    const formattedModified = (oldSubEntry.formatted !== newSubEntry.formatted);

    if (splittedModified || formattedModified) {
        return createUpdateSubEntry(
            splittedModified ? 'modified' : '',
            formattedModified ? 'modified' : ''
        )
    }

    // not modified
    return null;
}

function createUpdateEntry(path: string, oldHash: HashEntry, newHash: HashEntry): UpdateEntry {
    // check modification
    const whatwg = compareSubEntry(oldHash ? oldHash.whatwg : null,
                                   newHash ? newHash.whatwg : null);
    const w3c = compareSubEntry(oldHash ? oldHash.w3c : null,
                                newHash ? newHash.w3c : null);

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
        diffStats: '',
    };
    return entry;
}


function createUpdateEntries(oldData: HashData, newData: HashData): UpdateEntry[] {
    const updateEntries: UpdateEntry[] = [];
    
    // added or modified
    for (const path of newData.paths) {
        const oldHash = oldData.path2HashEntry.get(path);
        const newHash = newData.path2HashEntry.get(path);

        const updateLog: UpdateEntry = createUpdateEntry(path, oldHash, newHash)
        if (updateLog) {
            updateEntries.push(updateLog);
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

        const updateLog: UpdateEntry = createUpdateEntry(path, oldHash, newHash)
        if (updateLog) {
            updateEntries.push(updateLog);
        }
    }

    return updateEntries;
}

export async function deployUpdate(oldDiffEntries: DiffEntry[], newDiffEntries: DiffEntry[], updateRef: Firebase): Promise<void> {
    const fetchRoot = path.join(__dirname, '..', 'fetcher', 'data');
    const fetchText = await readFile(path.join(fetchRoot, 'fetch.json'));
    const fetchData = JSON.parse(fetchText);


    const sectionToHash = {};

    const oldData = createHashData(oldDiffEntries);
    const newData = createHashData(newDiffEntries);

    const updatedEntries = createUpdateEntries(oldData, newData);
    const data = {
        datetime: fetchData.time,
        updated: updatedEntries
    };

    await updateRef.push(data);
}
