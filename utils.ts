'use strict';
import * as fs from 'fs';
import * as path from 'path';

//
// I/O
//
export function readFile(srcPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(srcPath, 'utf-8', (err, str) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    resolve('');
                    return;
                }
                
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
