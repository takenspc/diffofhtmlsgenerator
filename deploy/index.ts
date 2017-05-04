import * as path from 'path';
import * as admin from 'firebase-admin';
import { readFile, log } from '../shared/utils';
import { UnifiedSection } from '../diff/unifiedSection';
import { update } from '../updater';
import { deployDiff } from './diff';
import { tweet } from './tweet';


//
// Index
//
function readUnifiedSectionsFromFirebase(indexRef: admin.database.Reference): Promise<UnifiedSection[]> {
    return indexRef.once('value').then((dataSnapshot) => {
        return dataSnapshot.val();
    });
}


//
// Entry point
//
export async function deploy(): Promise<void> {
    const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || null;
    if (!SERVICE_ACCOUNT || !DATABASE_URL) {
        log(['deploy', 'skip', 'deploy']);
        return;
    }

    admin.initializeApp({
        credential: admin.credential.cert(SERVICE_ACCOUNT),
        databaseURL: DATABASE_URL,
        databaseAuthVariableOverride: {
            canRead: true,
            canWrite: true,
        },
    });
    const firebaseRef = admin.database().ref('/');

    log(['deploy', 'update', 'start']);
    const indexRef = firebaseRef.child('index');
    const oldUnifiedSections = await readUnifiedSectionsFromFirebase(indexRef);
    const newUnifiedSections = await UnifiedSection.read();

    const updateData = await update(oldUnifiedSections, newUnifiedSections);

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
    indexRef.set(newUnifiedSections);
    log(['deploy', 'index', 'end']);

    log(['deploy', 'diff', 'start']);
    const diffRef = firebaseRef.child('diff');
    await deployDiff(newUnifiedSections, diffRef);
    log(['deploy', 'diff', 'end']);
}
