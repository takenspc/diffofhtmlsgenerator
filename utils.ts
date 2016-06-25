import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirpModule from 'mkdirp';
import * as moment from 'moment';

//
// I/O
//
export function readFile(srcPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(srcPath, 'utf-8', (err, str) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(str);
        });
    });    
}

export function writeFile(outPath: string, str: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.writeFile(outPath, str, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

export function mkdirp(dirname): Promise<any> {
    return new Promise((resolve, reject) => {
        mkdirpModule(dirname, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        })
    })
}


//
// logging
//
export function log(args): void {
    const message = [moment().utc().format()].concat(args).join('\t');
    console.log(message);
}

//
// Hash
//
export function sha256(text: string): string {
    const hash = crypto.createHash('sha256');
    // https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding
    // > hash.update(data[, input_encoding])
    // > If encoding is not provided, and the data is a string,
    // > an encoding of 'binary' is enforced
    hash.update(text);
    return hash.digest('hex');
}
