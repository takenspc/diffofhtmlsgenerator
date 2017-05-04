interface Sectionable {
    sections: any[];
}

export function* nextLeafSection<T extends Sectionable>(sections: T[]): Iterable<T> {
    for (const section of sections) {
        if (!section.sections || section.sections.length === 0) {
            yield section;
        } else {
            yield* nextLeafSection<T>(section.sections);
        }
    }
}
