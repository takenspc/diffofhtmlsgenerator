'use strict'; // XXX
import * as path from 'path';
import * as Firebase from 'firebase';
import { readFile, log } from '../utils';
import { DiffEntry, nextLeafDiffEntry, readDiffEntry } from '../diffEntry';
import { deployDiff } from './diff';
import { deployUpdate} from './update';


//
// Index
//
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
    const URL = process.env.FIREBASE_URL || null;
    const AUTH_TOKEN = process.env.FIREBASE_AUTH_TOKEN || null;
    if (!URL || !AUTH_TOKEN) {
        return;
    }

    const firebaseRef = new Firebase(URL);
    await firebaseRef.authWithCustomToken(AUTH_TOKEN);

    log(['deploy', 'index', 'start']);
    const indexRef = firebaseRef.child('index');
    // const oldDiffRoot = path.join(__dirname, '..', 'diff', 'data-old');   
    // const oldDiffEntries = await readDiffEntriesFromDisk(oldDiffRoot);
    const oldDiffEntries = await readDiffEntriesFromFirebase(indexRef);
    
    const diffRoot = path.join(__dirname, '..', 'diff', 'data');
    const diffEntries = await readDiffEntry(diffRoot);
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
