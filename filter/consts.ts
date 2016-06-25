//
// Attrs
//
export const excludeAttrs = new Set([
    'id',
    'role',
]);

export const excludeClassNames = new Set([
    'heading',
    'settled',
    'highlight',
]);


//
//
//
export const textLevelElements: Set<string> = new Set([
    'a',
    'em',
    'strong',
    'dfn',
    'code',
    'var',
    'i',
]);

//
// Bikeshed
//
export const headingElements: Set<string> = new Set([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
]);

export const headingClassNames: Set<string> = new Set([
    'secno',
    'content',
]);

export const pygmentsClassNames: Set<string> = new Set([
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
export const contextElements: Set<string> = new Set([
    'pre',

    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
]);
