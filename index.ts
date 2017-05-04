import * as log4js from 'log4js';
import { deploy } from './deploy';
import { diff } from './diff';
import { fetch } from './fetcher';
import { format } from './formatter';
import { split } from './splitter';

async function main(logger: log4js.Logger): Promise<void> {
    logger.info('fetch - start');
    await fetch(logger);
    logger.info('fetch - end');

    logger.info('split - start');
    await split(logger);
    logger.info('split - end');

    logger.info('format - start');
    await format(logger);
    logger.info('format - end');

    logger.info('diff - start');
    await diff(logger);
    logger.info('diff - end');

    logger.info('deploy - start');
    await deploy(logger);
    logger.info('deploy - end');
}

if (require.main === module) {
    const logger = log4js.getLogger();
    main(logger).then(() => {
        logger.info('done');
    }).catch((err) => {
        logger.error('error', err);
        logger.error(err.stack);
        throw err;
    });
}
