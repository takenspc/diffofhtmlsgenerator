import { readFile } from '../../utils';
import { ASTNode, parse } from 'parse5';

//
// Document
//
export class Document {
    private node: ASTNode
    private text: string

    constructor(text: string, node: ASTNode) {
        this.text = text;
        this.node = node;
    }

    static parse(htmlPath): Promise<Document> {
        return readFile(htmlPath).then((text) => {
            const node = parse(text, {
                locationInfo: true,
            });
            const doc = new Document(text, node);

            return doc;
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
