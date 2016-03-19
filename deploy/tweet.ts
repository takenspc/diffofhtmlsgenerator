'use strict'; // XXX
import * as path from 'path';
import * as Twitter from 'twitter';
import { UpdateEntry } from '../updater';


function isUpdated(updateEntries: UpdateEntry[], org: string, orgTitle: string): string {
    var updated = updateEntries.filter(function(updateEntry) {
        return !!updateEntry[org];
    });

    if (updated.length > 0) {
        return orgTitle + ' is updated';
    }

    return orgTitle + ' is not updated';
}

function createTweet(updatedTime: number, updateEntries: UpdateEntry[]) {
    const messages = [];

    const updated = moment(updatedTime).utc()
    const momentFormat = 'YYYY-M-D (UTC)';

    messages.push(updated.format(momentFormat));
    messages.push(updateEntries, 'whatwg', 'WHATWG HTML Standard');
    messages.push(updateEntries, 'w3c', 'W3C HTML 5.1');

    const tweet = {
        status: messages.join(' '),
    }
    return tweet;
}

export function tweet(updatedTime: number, updateEntries: UpdateEntry[]): Promise<any> {
    const client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const url = 'statuses/update';
    const tweet = createTweet(updatedTime, updateEntries);

    return new Promise((resolve, reject) => {
        client.post(url, tweet, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}
