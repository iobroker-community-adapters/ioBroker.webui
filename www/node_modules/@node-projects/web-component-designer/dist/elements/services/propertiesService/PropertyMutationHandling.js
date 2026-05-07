function getMutationAttributeValue(mutation) {
    const target = mutation.target;
    if (typeof target.getAttribute !== 'function' || !mutation.attributeName)
        return null;
    return target.getAttribute(mutation.attributeName);
}
function getStyleDeclarationNames(styleText, filter) {
    const names = new Set();
    if (!styleText)
        return names;
    let name = '';
    let inValue = false;
    let quote = null;
    for (let i = 0; i < styleText.length; i++) {
        const char = styleText[i];
        if (quote) {
            if (char === '\\') {
                i++;
                continue;
            }
            if (char === quote)
                quote = null;
            continue;
        }
        if (char === '\'' || char === '"') {
            quote = char;
            continue;
        }
        if (!inValue) {
            if (char === ':') {
                inValue = true;
                continue;
            }
            if (char === ';') {
                name = '';
                continue;
            }
            name += char;
            continue;
        }
        if (char === ';') {
            const trimmedName = name.trim();
            if (trimmedName && (!filter || filter(trimmedName)))
                names.add(trimmedName);
            name = '';
            inValue = false;
        }
    }
    if (inValue) {
        const trimmedName = name.trim();
        if (trimmedName && (!filter || filter(trimmedName)))
            names.add(trimmedName);
    }
    else {
        const trimmedName = name.trim();
        if (!name)
            return names;
        if (!filter || filter(trimmedName))
            names.add(trimmedName);
    }
    return names;
}
function areSetsEqual(left, right) {
    if (left.size !== right.size)
        return false;
    for (const value of left) {
        if (!right.has(value))
            return false;
    }
    return true;
}
export function didAttributePresenceChange(mutation) {
    if (mutation.type !== 'attributes' || !mutation.attributeName)
        return false;
    const currentValue = getMutationAttributeValue(mutation);
    return mutation.oldValue == null || currentValue == null;
}
export function didStyleDeclarationSetChange(mutation, filter) {
    if (mutation.type !== 'attributes' || mutation.attributeName !== 'style')
        return false;
    const currentValue = getMutationAttributeValue(mutation);
    const oldNames = getStyleDeclarationNames(mutation.oldValue, filter);
    const currentNames = getStyleDeclarationNames(currentValue, filter);
    return !areSetsEqual(oldNames, currentNames);
}
export function didCustomStyleDeclarationSetChange(mutation) {
    return didStyleDeclarationSetChange(mutation, name => name.startsWith('--'));
}
//# sourceMappingURL=PropertyMutationHandling.js.map