'use strict';

//
// Formatting
//
export const BreakBeforeStartTag: Set<string> = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'body',
    'caption',
    'dd',
    'details',
    'dialog',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'legend',
    'li',
    'main',
    'map',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'table',
    'tbody',
    'td',
    'template',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
    'svg',
]);

export const BreakBeforeEndTag: Set<string> = new Set([
    'blockquote',
    'dd',
    'div',
    'dl',
    'dt',
    'li',
    'ol',
    'table',
    'tbody',
    'tfoot',
    'thead',
    'tr',
    'ul',
]);

//
// Void elements
// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
//
export const VoidElements: Set<string> = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

//
// Heading content
// https://html.spec.whatwg.org/multipage/dom.html#heading-content
//
export const HeadingContent: Set<string> = new Set([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hgroup',
]);



//
//
//
export const TextLevelElements: Set<string> = new Set([
    'a',
    'b',
    'cite', 
    'code',
    'dfn',
    'em',
    'i',
    'kbd',
    'samp',   
    'strong',
    'var',
]);

//
// Bikeshed
//
export const BikeshedHeadingClassNames: Set<string> = new Set([
    'secno',
    'content',
]);

export const BikeshedHighlightClassNames: Set<string> = new Set([
    'err',
    'c', /* Comment */
    'k', /* Keyword */
    'l', /* Literal */
    'n', /* Name */
    'o', /* Operator */
    'p', /* Punctuation */
    'cm', /* Comment.Multiline */
    'cp', /* Comment.Preproc */
    'c1', /* Comment.Single */
    'cs', /* Comment.Special */
    'kc', /* Keyword.Constant */
    'kd', /* Keyword.Declaration */
    'kn', /* Keyword.Namespace */
    'kp', /* Keyword.Pseudo */
    'kr', /* Keyword.Reserved */
    'kt', /* Keyword.Type */
    'ld', /* Literal.Date */
    'm', /* Literal.Number */
    's', /* Literal.String */
    'na', /* Name.Attribute */
    'nc', /* Name.Class */
    'no', /* Name.Constant */
    'nd', /* Name.Decorator */
    'ni', /* Name.Entity */
    'ne', /* Name.Exception */
    'nf', /* Name.Function */
    'nl', /* Name.Label */
    'nn', /* Name.Namespace */
    'py', /* Name.Property */
    'nt', /* Name.Tag */
    'nv', /* Name.Variable */
    'ow', /* Operator.Word */
    'mb', /* Literal.Number.Bin */
    'mf', /* Literal.Number.Float */
    'mh', /* Literal.Number.Hex */
    'mi', /* Literal.Number.Integer */
    'mo', /* Literal.Number.Oct */
    'sb', /* Literal.String.Backtick */
    'sc', /* Literal.String.Char */
    'sd', /* Literal.String.Doc */
    's2', /* Literal.String.Double */
    'se', /* Literal.String.Escape */
    'sh', /* Literal.String.Heredoc */
    'si', /* Literal.String.Interpol */
    'sx', /* Literal.String.Other */
    'sr', /* Literal.String.Regex */
    's1', /* Literal.String.Single */
    'ss', /* Literal.String.Symbol */
    'vc', /* Name.Variable.Class */
    'vg', /* Name.Variable.Global */
    'vi', /* Name.Variable.Instance */
    'il', /* Literal.Number.Integer.Long */
    //
    'nb',
    'nx',
]);


//
// Context
//
export const ContextElements: Set<string> = new Set([
    'pre',

    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hgroup',
]);
