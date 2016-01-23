'use strict';

export const BreakAfterStartTag: Set<string> = new Set([
    "article",
    "aside",
    "blockquote",
    "body",
    "details",
    "dialog",
    "dl",
    "fieldset",
    "figure",
    "footer",
    "form",
    "header",
    "hgroup",
    "main",
    "map",
    "nav",
    "ol",
    "section",
    "table",
    "tbody",
    "tfoot",
    "thead",
    "tr",
    "ul",
    'hr',
]);

export const BreakAfterEndTag: Set<string> = new Set([
    'address',
    'area',
    'article',
    'aside',
    'blockquote',
    'body',
    'br',
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
    'html',
    'legend',
    'li',
    'main',
    'map',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'summary',
    'table',
    'tbody',
    'td',
    'template',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
]);

export const VoidElements = new Set([
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

export const HighlightClassNames: Set<string> = new Set([
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
]);
