import { Section } from '../section';

//
// Heading
//
const HEADING_REPLACEMENT_MAP = new Map<any, string>([
    // Format:
    // [w3c text, whatwg text],
    //
    ['’', '\''],

    // Introduction
    ['XML Syntax', 'XML syntax'],

    // Common infrastructure
    ['Colors', 'Colours'],

    // The elements of HTML
    ['The root element', 'The document element'],

    // Media elements
    // Synchronising multiple media elements
    ['Synchronizing', 'Synchronising'],

    // The input element
    // Colour state (type=color)
    ['Color ', 'Colour '],
    // Common event behaviours
    ['behaviors', 'behaviours'],
    // APIs for the text field selections
    ['APIs for text field selections', 'APIs for the text control selections'],

    // The canvas element
    // Colour spaces and colour correction
    ['color ', 'colour '],

    // Scripting
    // HostPromiseRejectionTracker(promise, operation)
    ['The HostPromiseRejectionTracker implementation', 'HostPromiseRejectionTracker(promise, operation)'],

    // Matching HTML elements using selectors and CSS
    [/^Matching HTML elements using selectors$/, 'Matching HTML elements using selectors and CSS'],

    // User interaction
    ['The designMode IDL attribute', 'the designMode IDL attribute'],

    // Drag-and-drop processing model
    ['Drag-and-drop processing model', 'Processing model'],

    // Serialising HTML fragments
    // Serialising XHTML fragments
    ['Serializing', 'Serialising'],
]);

export function normalizeHeadingText(original: string): string {
    let headingText = original;
    for (const [target, replacement] of HEADING_REPLACEMENT_MAP) {
        headingText = headingText.replace(target, replacement);
    }

    return headingText;
}
