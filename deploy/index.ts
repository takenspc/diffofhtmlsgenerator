import * as path from 'path';
import * as Firebase from 'firebase';
import { readFile, log } from '../utils';
import { DiffEntry, nextLeafDiffEntry, readDiffEntry } from '../diffEntry';
import { update } from '../updater';
import { deployDiff } from './diff';
import { tweet } from './tweet';


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

    log(['deploy', 'update', 'start']);
    const indexRef = firebaseRef.child('index');
    const oldDiffEntries = await readDiffEntryFromFirebase(indexRef);

    const diffRoot = path.join(__dirname, '..', 'diff', 'data');
    const newDiffEntries = await readDiffEntry(diffRoot);

    // update() writes updateData into disk
    await update(oldDiffEntries, newDiffEntries);

    // read updateData previously written
    // I know this is redundant...
    const updatePath = path.join(__dirname, '..', 'updater', 'data', 'update.json');
    const updateText = await readFile(updatePath);
    const updateData = JSON.parse(updateText);

    const fetchPath = path.join(__dirname, '..', 'fetcher', 'data', 'fetch.json');
    const fetchText = await readFile(fetchPath);
    const fetchData = JSON.parse(fetchText);

    const data = {
        datetime: fetchData.time,
        updated: updateData,
    };

    const updateRef = firebaseRef.child('update');
    await updateRef.push(data);
    await tweet(fetchData.time, updateData);
    log(['deploy', 'update', 'end']);

    log(['deploy', 'index', 'start']);
    indexRef.set(newDiffEntries);
    log(['deploy', 'index', 'end']);  

    log(['deploy', 'diff', 'start']);
    const diffRef = firebaseRef.child('diff');
    await deployDiff(diffRoot, newDiffEntries, diffRef);
    log(['deploy', 'diff', 'end']);


    Firebase.goOffline();
}
