import { deploy } from './deploy';
import { diff } from './diff';
import { fetch } from './fetcher';
import { format } from './formatter';
import { log } from './shared/utils';
import { split } from './splitter';

async function main(): Promise<void> {
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

    log(['deploy', '', 'start']);
    await deploy();
    log(['deploy', '', 'end']);
}

if (require.main === module) {
    main().then(() => {
        console.log('done');
    }).catch((err) => {
        console.log('err');
        console.error(err);
        console.error(err.stack);
        throw err;
    });
}
