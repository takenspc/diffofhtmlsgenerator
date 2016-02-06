'use strict'; // XXX
import * as path from 'path';
import * as Firebase from 'firebase';
import { readFile, log } from '../utils';
import { DiffEntry } from '../diff/';
import { deployDiff } from './diff';
import { deployUpdate} from './update';


//
// Index
//
export function* nextLeafSection(sections: DiffEntry[]): Iterable<DiffEntry> {
    for (const section of sections) {
        // XXX Firebase makes empty array be undefined
        // XXX section.sections must be always an array
        if (!section.sections) {
            section.sections = [];
        }

        if (section.sections.length === 0) {
            yield section;
        } else {
            yield* nextLeafSection(section.sections);
        }
    }
}

function readDiffEntriesFromDisk(srcRoot: string): Promise<DiffEntry[]> {
    const indexPath = path.join(srcRoot, 'index.json');
    return readFile(indexPath).then((text) => {
        const diffEntries = JSON.parse(text);
        return diffEntries;
    });
}

function readDiffEntriesFromFirebase(indexRef: Firebase): Promise<DiffEntry[]> {
    return new Promise((resolve, reject) => {
        indexRef.once('value', (dataSnapshot) => {
            resolve(dataSnapshot.val());            
        }, (err) => {
            reject(err);
        });
    });
}


//
// Entry point
//
export async function deploy(): Promise<void> {
    const firebaseURL = process.env.FIREBASE_URL || null;
    if (!firebaseURL) {
        return;
    }

    const firebaseRef = new Firebase(firebaseURL);

    log(['deploy', 'index', 'start']);
    const indexRef = firebaseRef.child('index');
    // const oldDiffRoot = path.join(__dirname, '..', 'diff', 'data-old');   
    // const oldDiffEntries = await readDiffEntriesFromDisk(oldDiffRoot);
    const oldDiffEntries = await readDiffEntriesFromFirebase(indexRef);
    
    const diffRoot = path.join(__dirname, '..', 'diff', 'data');
    const diffEntries = await readDiffEntriesFromDisk(diffRoot);
    indexRef.set(diffEntries);
    log(['deploy', 'index', 'end']);

    log(['deploy', 'diff', 'start']);
    const diffRef = firebaseRef.child('diff');
    await deployDiff(diffRoot, diffEntries, diffRef);
    log(['deploy', 'diff', 'end']);
    

    log(['deploy', 'update', 'start']);
    const updateRef = firebaseRef.child('update');
    await deployUpdate(oldDiffEntries, diffEntries, updateRef);
    log(['deploy', 'update', 'end']);

    Firebase.goOffline();
}
