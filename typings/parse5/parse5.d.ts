declare module 'parse5' {
    interface TreeAdapter {
        // TODO
    }
    
    interface ParserOptions {
        locationInfo?: boolean
        treeAdapter?: TreeAdapter
    }
    
    interface LocationInfo {
        line: number
        col: number
        startOffset: number
        endOffset: number
    }
    
    interface StartTagLocationInfo extends LocationInfo {
        // TODO
        attrs: any
    }
    
    interface ElementLocationInfo extends StartTagLocationInfo {
        startTag: StartTagLocationInfo
        endTag: LocationInfo
    }
    
    interface Attr {
        name: string
        value: string
    }
    
    interface ASTNode {
        // TODO
        nodeName: string
        tagName: string
        attrs: Attr[]
        namespaceURI: string
        childNodes: ASTNode[]
        parentNode: ASTNode
        value: string
        __location: StartTagLocationInfo
    }

    function parse(html: string, options?: ParserOptions): ASTNode
    function parseFragment(html: string, options?: ParserOptions): ASTNode
    function parseFragment(fragmentContext: ASTNode, html: string, options?: ParserOptions): ASTNode
}