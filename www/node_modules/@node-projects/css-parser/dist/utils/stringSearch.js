export const MAX_LOOP = 10000;
// ─── Character-code constants for fast comparisons ───────────────────────────
const Ch_BACKSLASH = 92; //  \
const Ch_OPEN_PAREN = 40; //  (
const Ch_DOUBLE_QUOTE = 34; //  "
const Ch_SINGLE_QUOTE = 39; //  '
/**
 * Find the first occurrence of any search string in the input string, ignoring escaped characters
 * @param string - The input string to search in
 * @param search - Array of strings to search for
 * @param position - Optional starting position for the search
 * @returns The index of the first match, or -1 if not found
 * @throws {Error} If too many escape sequences are encountered (> MAX_LOOP)
 * @example
 * ```ts
 * // Basic search
 * indexOfArrayNonEscaped('a,b,c', [',']) // 1
 *
 * // Handles escaped characters
 * indexOfArrayNonEscaped('a\\,b,c', [',']) // 4, the first comma is escaped
 * ```
 */
export const indexOfArrayNonEscaped = (string, search, position) => {
    let currentPosition = position ?? 0;
    let maxLoop = MAX_LOOP;
    do {
        // Find the minimum index across all search terms and backslash
        // without allocating temporary arrays.
        let found = string.indexOf('\\', currentPosition);
        for (let i = 0; i < search.length; i++) {
            const idx = string.indexOf(search[i], currentPosition);
            if (idx !== -1 && (found === -1 || idx < found)) {
                found = idx;
            }
        }
        if (found === -1) {
            return -1;
        }
        if (string.charCodeAt(found) === Ch_BACKSLASH) {
            currentPosition = found + 2;
            maxLoop--;
        }
        else {
            return found;
        }
    } while (maxLoop > 0);
    throw new Error('Too many escaping');
};
/**
 * Find the first occurrence of any search string in the input string, respecting brackets and quotes
 * @param string - The input string to search in
 * @param search - Array of strings to search for
 * @param position - Optional starting position for the search
 * @returns The index of the first match, or -1 if not found
 * @throws {Error} If too many escape sequences are encountered (> MAX_LOOP)
 * @example
 * ```ts
 * // Basic search
 * indexOfArrayWithBracketAndQuoteSupport('a,b,c', [',']) // 1
 *
 * // Respects brackets - won't match inside ()
 * indexOfArrayWithBracketAndQuoteSupport('(a,b),c', [',']) // 4, ignores the comma inside ()
 *
 * // Respects quotes - won't match inside quotes
 * indexOfArrayWithBracketAndQuoteSupport('"a,b",c', [',']) // 4, ignores the comma inside quotes
 * indexOfArrayWithBracketAndQuoteSupport("'a,b',c", [',']) // 4, ignores the comma inside quotes
 *
 * // Handles escaped characters
 * indexOfArrayWithBracketAndQuoteSupport('a\\,b,c', [',']) // 4, the first comma is escaped
 * ```
 */
export const indexOfArrayWithBracketAndQuoteSupport = (string, search, position) => {
    let currentSearchPosition = position ?? 0;
    let maxLoop = MAX_LOOP;
    do {
        // Find the minimum index across all search terms plus special characters,
        // without allocating temporary arrays on each iteration.
        let firstMatchPos = -1;
        for (let i = 0; i < search.length; i++) {
            const idx = string.indexOf(search[i], currentSearchPosition);
            if (idx !== -1 && (firstMatchPos === -1 || idx < firstMatchPos)) {
                firstMatchPos = idx;
            }
        }
        const parenIdx = string.indexOf('(', currentSearchPosition);
        if (parenIdx !== -1 && (firstMatchPos === -1 || parenIdx < firstMatchPos)) {
            firstMatchPos = parenIdx;
        }
        const dqIdx = string.indexOf('"', currentSearchPosition);
        if (dqIdx !== -1 && (firstMatchPos === -1 || dqIdx < firstMatchPos)) {
            firstMatchPos = dqIdx;
        }
        const sqIdx = string.indexOf("'", currentSearchPosition);
        if (sqIdx !== -1 && (firstMatchPos === -1 || sqIdx < firstMatchPos)) {
            firstMatchPos = sqIdx;
        }
        const bsIdx = string.indexOf('\\', currentSearchPosition);
        if (bsIdx !== -1 && (firstMatchPos === -1 || bsIdx < firstMatchPos)) {
            firstMatchPos = bsIdx;
        }
        if (firstMatchPos === -1) {
            return -1;
        }
        const charCode = string.charCodeAt(firstMatchPos);
        switch (charCode) {
            case Ch_BACKSLASH:
                currentSearchPosition = firstMatchPos + 2;
                break;
            case Ch_OPEN_PAREN:
                {
                    const endPosition = indexOfArrayWithBracketAndQuoteSupport(string, [')'], firstMatchPos + 1);
                    if (endPosition === -1) {
                        return -1;
                    }
                    currentSearchPosition = endPosition + 1;
                }
                break;
            case Ch_DOUBLE_QUOTE:
                {
                    const endQuotePosition = indexOfArrayNonEscaped(string, ['"'], firstMatchPos + 1);
                    if (endQuotePosition === -1) {
                        return -1;
                    }
                    currentSearchPosition = endQuotePosition + 1;
                }
                break;
            case Ch_SINGLE_QUOTE:
                {
                    const endQuotePosition = indexOfArrayNonEscaped(string, ["'"], firstMatchPos + 1);
                    if (endQuotePosition === -1) {
                        return -1;
                    }
                    currentSearchPosition = endQuotePosition + 1;
                }
                break;
            default:
                return firstMatchPos;
        }
        maxLoop--;
    } while (maxLoop > 0);
    throw new Error('Too many escaping');
};
/**
 * Split a string by search tokens, respecting brackets and quotes
 * @example
 * ```ts
 * splitWithBracketAndQuoteSupport('a,b', [',']) // ['a', 'b']
 * splitWithBracketAndQuoteSupport('a,(b,c)', [',']) // ['a', '(b,c)']
 * splitWithBracketAndQuoteSupport('a,"b,c"', [',']) // ['a', '"b,c"']
 * splitWithBracketAndQuoteSupport("a,'b,c'", [',']) // ['a', "'b,c'"]
 * ```
 */
export const splitWithBracketAndQuoteSupport = (string, search) => {
    const result = [];
    let currentPosition = 0;
    while (currentPosition < string.length) {
        const index = indexOfArrayWithBracketAndQuoteSupport(string, search, currentPosition);
        if (index === -1) {
            result.push(string.substring(currentPosition));
            return result;
        }
        result.push(string.substring(currentPosition, index));
        currentPosition = index + 1;
    }
    return result;
};
