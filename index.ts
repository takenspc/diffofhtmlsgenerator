'use strict'; // XXX
import { log } from './utils';
import { diff } from './diff';
import { fetch } from './fetcher';
import { format }  from './formatter';
import { split }  from './splitter';

async function main() {
    log(['start', 'fetch']);
    await fetch();
    log(['end', 'fetch']);

    log(['start', 'split']);
    await split();
    log(['end', 'split']);


    log(['start', 'format']);
    await format();
    log(['end', 'format']);

    log(['start', 'diff']);
    await diff();
    log(['end', 'diff']);
}


main().then(() => {
    console.log('done');
}).catch((err) => {
    console.log('err');
    console.error(err);
    console.error(err.stack);
})
