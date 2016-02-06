'use strict'; // XXX
import { log } from './utils';
import { diff } from './diff';
import { fetch } from './fetcher';
import { format }  from './formatter';
import { split }  from './splitter';

async function main() {
    log(['fetch', '', 'start']);
    await fetch();
    log(['fetch', '', 'end']);

    log(['split', '', 'start']);
    await split();
    log(['split', '', 'end']);

    log(['format', '', 'start']);
    await format();
    log(['format', '', 'end']);

    log(['diff', '', 'start']);
    await diff();
    log(['diff', '', 'end']);
}


main().then(() => {
    console.log('done');
}).catch((err) => {
    console.log('err');
    console.error(err);
    console.error(err.stack);
})
