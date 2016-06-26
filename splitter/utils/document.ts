import * as path from 'path';
import { readFile } from '../../utils';
import { ASTNode, parse } from 'parse5';

//
// Document
//
export class Document {
    private text: string
    private node: ASTNode

    init(htmlPath: string): Promise<void> {
        return readFile(htmlPath).then((text) => {
            this.text = text;
            this.node = parse(text, {
                locationInfo: true,
            });
        });
    }

    getBody(): ASTNode {
        for (const html of this.node.childNodes) {
            if (html.nodeName !== 'html') {
                continue;
            }

            for (const body of html.childNodes) {
                if (body.nodeName === 'body') {
                    return body;
                }
            }
        }

        return null;
    }

    getHTMLText(nodes: ASTNode[]): string {
        const start = nodes[0].__location.startOffset;
        const end = nodes[nodes.length - 1].__location.endOffset;
        return this.text.substring(start, end);
    }

}
