'use strict'; // XXX
import { fetch } from './fetcher';
import { format }  from './formatter';
import { split }  from './splitter';

async function main() {
    console.log('fetch');
    await fetch();

    console.log('split');
    await split();

    console.log('format');
    await format();
}


main().then(() => {
    console.log('done');
}).catch((err) => {
    console.log('err');
    console.error(err);
    console.error(err.stack);
})
