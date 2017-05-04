import * as moment from 'moment';
import * as path from 'path';
import * as Twitter from 'twitter';
import { UpdateEntry } from '../updater';

function createMessage(updateEntries: UpdateEntry[], org: string, orgTitle: string): string {
    const updated = updateEntries.filter((updateEntry) => {
        return !!updateEntry[org];
    });

    if (updated.length > 0) {
        return `${orgTitle} is updated. `;
    }

    return `${orgTitle} is not updated. `;
}

function createTweet(updatedTime: number, updateEntries: UpdateEntry[]): any {
    const messages = [];

    const updated = moment(updatedTime).utc();
    const momentFormat = 'YYYY-M-D (UTC): ';
    messages.push(updated.format(momentFormat));

    messages.push(createMessage(updateEntries, 'whatwg', 'WHATWG HTML Standard'));
    messages.push(createMessage(updateEntries, 'w3c', 'W3C HTML'));
    messages.push('https://diffofhtmls.herokuapp.com/log/#' + updatedTime);

    const message = messages.join('');

    const tweet = {
        status: message,
    };
    return tweet;
}

export function tweet(updatedTime: number, updateEntries: UpdateEntry[]): Promise<void> {
    const client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const url = 'statuses/update';
    const tweet = createTweet(updatedTime, updateEntries);

    return new Promise<void>((resolve, reject) => {
        client.post(url, tweet, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}
