import { AST, parse } from 'parse5';
import * as path from 'path';
import { readFile } from '../../shared/utils';

//
// Document
//
export class Document {
    private text: string
    private node: AST.Default.Document

    init(htmlPath: string): Promise<void> {
        return readFile(htmlPath).then((text) => {
            this.text = text;
            this.node = parse(text, {
                locationInfo: true,
            }) as AST.Default.Document;
        });
    }

    getBody(): AST.Default.Element {
        for (const html of this.node.childNodes) {
            if (html.nodeName !== 'html') {
                continue;
            }

            for (const body of (html as AST.Default.Element).childNodes) {
                if (body.nodeName === 'body') {
                    return body as AST.Default.Element;
                }
            }
        }

        return null;
    }

    getHTMLText(nodes: AST.Default.Element[]): string {
        const start = nodes[0].__location.startOffset;
        const end = nodes[nodes.length - 1].__location.endOffset;
        return this.text.substring(start, end);
    }

}
