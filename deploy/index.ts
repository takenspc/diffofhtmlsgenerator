'use strict'; // XXX
import * as path from 'path';
import * as Firebase from 'firebase';
import { readFile, log } from '../utils';
import { DiffEntry, nextLeafDiffEntry, readDiffEntry } from '../diffEntry';
import { deployDiff } from './diff';
import { update } from '../updater';


//
// Index
//
function readDiffEntryFromFirebase(indexRef: Firebase): Promise<DiffEntry[]> {
    return new Promise((resolve, reject) => {
        indexRef.once('value', (dataSnapshot) => {
            resolve(dataSnapshot.val());            
        }, (err) => {
            reject(err);
        });
    });
}


async function computeUpdateFromFirebase(indexRef: Firebase, diffEntry: DiffEntry[]): Promise<void> {
    const oldDiffEntries = await readDiffEntryFromFirebase(indexRef);
    await update(oldDiffEntries, diffEntry);
}

//
// Entry point
//
export async function deploy(): Promise<void> {
    const URL = process.env.FIREBASE_URL || null;
    const AUTH_TOKEN = process.env.FIREBASE_ADMIN_AUTH_TOKEN || null;
    if (!URL || !AUTH_TOKEN) {
        log(['deploy', 'skip', 'deploy']);
        return;
    }

    const firebaseRef = new Firebase(URL);
    await firebaseRef.authWithCustomToken(AUTH_TOKEN);

    log(['deploy', 'index', 'start']);
    const diffRoot = path.join(__dirname, '..', 'diff', 'data');
    const diffEntries = await readDiffEntry(diffRoot);

    const indexRef = firebaseRef.child('index');
    indexRef.set(diffEntries);
    log(['deploy', 'index', 'end']);  

    log(['deploy', 'update', 'start']);
    await computeUpdateFromFirebase(indexRef, diffEntries);
    
    const fetchPath = path.join(__dirname, '..', 'fetcher', 'data', 'fetch.json');
    const fetchText = await readFile(fetchPath);
    const fetchData = JSON.parse(fetchText);

    const updatePath = path.join(__dirname, '..', 'updater', 'data', 'update.json');
    const updateText = await readFile(updatePath);
    const updateData = JSON.parse(updateText);

    const data = {
        datetime: fetchData.time,
        updated: updateData,
    };

    const updateRef = firebaseRef.child('update');
    await updateRef.push(data);
    log(['deploy', 'update', 'end']);

    log(['deploy', 'diff', 'start']);
    const diffRef = firebaseRef.child('diff');
    await deployDiff(diffRoot, diffEntries, diffRef);
    log(['deploy', 'diff', 'end']);


    Firebase.goOffline();
}

