/**
 * A fast lexer (scanner) for CSS input.
 *
 * Inspired by the approach used in es-module-shims / es-module-lexer,
 * this lexer uses numeric character-code comparisons (`charCodeAt`)
 * instead of single-character string comparisons, and employs sticky
 * (`y`-flag) regular expressions matched directly against the full
 * input to avoid creating temporary substring slices.
 *
 * The Lexer keeps an index (`pos`) into the original input.  Simple
 * token types (whitespace, braces, colons, semicolons, commas) are
 * scanned character-by-character via `charCodeAt`, avoiding regular
 * expressions for those cases.  For complex patterns `matchRegex` uses
 * a sticky regex positioned at `pos` so no string copy is needed.
 */
// ─── Character-code constants ────────────────────────────────────────────────
// Using charCodeAt comparisons is measurably faster than creating
// single-character strings and comparing with `===`.
const Ch_TAB = 9; //  \t
const Ch_LF = 10; //  \n
const Ch_FF = 12; //  \f
const Ch_CR = 13; //  \r
const Ch_SPACE = 32; //  ' '
const Ch_COMMA = 44; //  ,
const Ch_SLASH = 47; //  /
const Ch_COLON = 58; //  :
const Ch_SEMI = 59; //  ;
const Ch_AT = 64; //  @
const Ch_OPEN = 123; //  {
const Ch_CLOSE = 125; //  }
const Ch_STAR = 42; //  *
export class Lexer {
    /** The complete CSS source string. */
    input;
    /** Current read position (index into `input`). */
    pos;
    /** Current source line (1-based). */
    lineno;
    /** Current source column (1-based). */
    column;
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.lineno = 1;
        this.column = 1;
    }
    // ─── Lookahead helpers ────────────────────────────────────────────────────
    /** Returns `true` when there is still input to consume. */
    get hasMore() {
        return this.pos < this.input.length;
    }
    /**
     * Returns the character code at `pos + offset` without advancing,
     * or `NaN` when past the end of input.
     *
     * Comparing numeric codes (`charCodeAt`) is faster than creating
     * single-character strings with bracket indexing.
     */
    charCodeAt(offset = 0) {
        return this.input.charCodeAt(this.pos + offset);
    }
    /**
     * Returns the character at `pos + offset` without advancing, or an
     * empty string when past the end of input.
     */
    charAt(offset = 0) {
        return this.input[this.pos + offset] ?? '';
    }
    /**
     * Returns the remaining input from the current position.
     *
     * This creates a new string (same cost as the old `css.slice(…)` approach)
     * and is provided for compatibility with the bracket/quote-aware search
     * utilities that accept a plain string.
     */
    get remaining() {
        return this.input.slice(this.pos);
    }
    // ─── Consumption helpers ──────────────────────────────────────────────────
    /**
     * Advance `pos` by `n` characters, updating line/column tracking.
     * Returns the consumed slice.
     */
    consume(n) {
        const start = this.pos;
        const end = start + n;
        this._advanceRange(start, end);
        return this.input.slice(start, end);
    }
    /**
     * Advance `pos` up to (but not including) `absolutePos`, updating
     * line/column tracking.  Returns the consumed slice.
     */
    consumeTo(absolutePos) {
        return this.consume(absolutePos - this.pos);
    }
    /**
     * Apply a sticky (`y`-flag) regex directly against the full input
     * at the current position.  If the regex matches, the matched text
     * is consumed and the `RegExpExecArray` is returned; otherwise
     * `null` is returned and `pos` is not changed.
     *
     * Using the `y` flag with `lastIndex` avoids creating a temporary
     * substring slice (which the old `^`-anchor + `this.remaining`
     * approach required).
     */
    matchRegex(re) {
        re.lastIndex = this.pos;
        const m = re.exec(this.input);
        if (m) {
            this._advanceRange(this.pos, this.pos + m[0].length);
        }
        return m;
    }
    // ─── Character-based token scanners ──────────────────────────────────────
    /**
     * Consume zero or more whitespace characters (space, tab, CR, LF,
     * form-feed) using `charCodeAt` instead of string comparisons.
     */
    skipWhitespace() {
        const src = this.input;
        const len = src.length;
        while (this.pos < len) {
            const ch = src.charCodeAt(this.pos);
            if (ch === Ch_LF) {
                this.lineno++;
                this.column = 1;
                this.pos++;
            }
            else if (ch === Ch_SPACE ||
                ch === Ch_TAB ||
                ch === Ch_CR ||
                ch === Ch_FF) {
                this.column++;
                this.pos++;
            }
            else {
                break;
            }
        }
    }
    /**
     * If the current character is `{`, consume it and any following
     * whitespace, then return `true`.  Otherwise return `false`.
     */
    tryOpenBrace() {
        if (this.input.charCodeAt(this.pos) !== Ch_OPEN) {
            return false;
        }
        this.pos++;
        this.column++;
        this.skipWhitespace();
        return true;
    }
    /**
     * If the current character is `}`, consume it and return `true`.
     * Otherwise return `false`.
     */
    tryCloseBrace() {
        if (this.input.charCodeAt(this.pos) !== Ch_CLOSE) {
            return false;
        }
        this.pos++;
        this.column++;
        return true;
    }
    /**
     * If the current character is `:`, consume it and any following
     * whitespace, then return `true`.  Otherwise return `false`.
     */
    tryColon() {
        if (this.input.charCodeAt(this.pos) !== Ch_COLON) {
            return false;
        }
        this.pos++;
        this.column++;
        this.skipWhitespace();
        return true;
    }
    /**
     * Consume any leading semicolons and whitespace characters using
     * `charCodeAt` instead of string comparisons.
     */
    skipSemicolonAndWhitespace() {
        const src = this.input;
        const len = src.length;
        while (this.pos < len) {
            const ch = src.charCodeAt(this.pos);
            if (ch === Ch_LF) {
                this.lineno++;
                this.column = 1;
                this.pos++;
            }
            else if (ch === Ch_SEMI ||
                ch === Ch_SPACE ||
                ch === Ch_TAB ||
                ch === Ch_CR ||
                ch === Ch_FF) {
                this.column++;
                this.pos++;
            }
            else {
                break;
            }
        }
    }
    /**
     * If the current character is `,`, consume it and any following
     * whitespace, then return `true`.  Otherwise return `false`.
     */
    tryCommaAndWhitespace() {
        if (this.input.charCodeAt(this.pos) !== Ch_COMMA) {
            return false;
        }
        this.pos++;
        this.column++;
        this.skipWhitespace();
        return true;
    }
    // ─── Position snapshot ────────────────────────────────────────────────────
    /**
     * Returns a snapshot of the current source position as an object
     * suitable for use in `Position` nodes.
     */
    getPosition() {
        return { line: this.lineno, column: this.column };
    }
    // ─── Internal helpers ─────────────────────────────────────────────────────
    /**
     * Update `lineno`, `column`, and `pos` for a range of characters in
     * the original input.  Uses `charCodeAt` for the newline check.
     */
    _advanceRange(from, to) {
        const src = this.input;
        for (let i = from; i < to; i++) {
            if (src.charCodeAt(i) === Ch_LF) {
                this.lineno++;
                this.column = 1;
            }
            else {
                this.column++;
            }
        }
        this.pos = to;
    }
}
// Re-export character codes so the parser can use them for fast checks
export { Ch_AT, Ch_CLOSE, Ch_SLASH, Ch_STAR };
