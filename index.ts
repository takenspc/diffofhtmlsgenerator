'use strict'; // XXX
import { log } from './utils';
import { diff } from './diff';
import { fetch } from './fetcher';
import { format } from './formatter';
import { split } from './splitter';
import { deploy } from './deploy';

async function main() {
    log(['fetch', '', 'start']);
    await fetch();
    global.gc();
    log(['fetch', '', 'end']);

    log(['split', '', 'start']);
    await split();
    global.gc();
    log(['split', '', 'end']);

    log(['format', '', 'start']);
    await format();
    global.gc();
    log(['format', '', 'end']);

    log(['diff', '', 'start']);
    await diff();
    global.gc();
    log(['diff', '', 'end']);

    log(['deploy', '', 'start']);
    await deploy();
    global.gc();
    log(['deploy', '', 'end']);
}


main().then(() => {
    console.log('done');
    process.exit(0);
}).catch((err) => {
    console.log('err');
    console.error(err);
    console.error(err.stack);
    process.exit(-1);
});
