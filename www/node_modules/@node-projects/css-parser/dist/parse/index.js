import CssParseError from '../CssParseError.js';
import Position from '../CssPosition.js';
import { CssTypes, } from '../type.js';
import { indexOfArrayWithBracketAndQuoteSupport, splitWithBracketAndQuoteSupport, } from '../utils/stringSearch.js';
import { Ch_AT, Ch_CLOSE, Ch_SLASH, Ch_STAR, Lexer } from './lexer.js';
// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
// New rule => https://www.w3.org/TR/CSS22/syndata.html#comments
// [^] is equivalent to [.\n\r]
const commentRegex = /\/\*[^]*?(?:\*\/|$)/g;
// ─── Sticky regexes (y-flag) ────────────────────────────────────────────────
// Using sticky regexes matched against the full input string avoids
// creating a temporary substring on every `matchRegex` call.
const re_comment = /\/\*[^]*?\*\//y;
const re_propName = /(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/y;
const re_keyframeValue = /((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/y;
const re_keyframesName = /@([-\w]+)?keyframes\s*/y;
const re_identifier = /([-\w]+)\s*/y;
const re_supports = /@supports *([^{]+)/y;
const re_host = /@host\s*/y;
const re_container = /@container *([^{]+)/y;
const re_layer = /@layer *([^{;@]+)/y;
const re_media = /@media *([^{]+)/y;
const re_customMedia = /@custom-media\s+(--\S+)\s+([^{;\s][^{;]*);/y;
const re_page = /@page */y;
const re_document = /@([-\w]+)?document *([^{]+)/y;
const re_fontFace = /@font-face\s*/y;
const re_property = /@property\s+(--[-\w]+)\s*/y;
const re_counterStyle = /@counter-style\s+([-\w]+)\s*/y;
const re_fontFeatureValues = /@font-feature-values\s+([^{]+)/y;
const re_scope = /@scope\s*([^{]*)/y;
const re_viewTransition = /@view-transition\s*/y;
const re_positionTry = /@position-try\s+(--[-\w]+)\s*/y;
const re_startingStyle = /@starting-style\s*/y;
const re_genericAtRule = /@([-\w]+)\s*/y;
// Pre-compiled page margin box regex (moved to module scope to avoid re-creation)
const pageMarginBoxNames = [
    'top-left-corner',
    'top-left',
    'top-center',
    'top-right',
    'top-right-corner',
    'bottom-left-corner',
    'bottom-left',
    'bottom-center',
    'bottom-right',
    'bottom-right-corner',
    'left-top',
    'left-middle',
    'left-bottom',
    'right-top',
    'right-middle',
    'right-bottom',
];
const re_pageMarginBox = new RegExp(`@(${pageMarginBoxNames.join('|')})(?![\\w-])\\s*`, 'y');
// Pre-compiled non-block at-rule regexes.
// NOTE: these patterns are inherited from the original _compileAtRule factory.
const re_atImport = /@import\s*((?::?[^;'"]|"(?:\\"|[^"])*?"|'(?:\\'|[^'])*?')+)(?:;|$)/y;
const re_atCharset = /@charset\s*((?::?[^;'"]|"(?:\\"|[^"])*?"|'(?:\\'|[^'])*?')+)(?:;|$)/y;
const re_atNamespace = /@namespace\s*((?::?[^;'"]|"(?:\\"|[^"])*?"|'(?:\\'|[^'])*?')+)(?:;|$)/y;
export const parse = (css, options) => {
    options = options || {};
    const lexer = new Lexer(css);
    const preserveFormatting = options.preserveFormatting ?? false;
    /**
     * Insert whitespace AST nodes between sibling nodes in an array.
     * Uses position offsets from the source to compute whitespace text.
     */
    function insertWhitespace(nodes, containerStart, containerEnd) {
        if (!preserveFormatting) {
            return nodes;
        }
        const result = [];
        let cursor = containerStart;
        for (const node of nodes) {
            const start = node.position?.start?.offset;
            if (start != null && start > cursor) {
                const wsText = css.slice(cursor, start);
                if (wsText) {
                    result.push({ type: CssTypes.whitespace, value: wsText });
                }
            }
            result.push(node);
            const end = node.position?.end?.offset;
            if (end != null) {
                cursor = end;
            }
        }
        if (cursor < containerEnd) {
            const wsText = css.slice(cursor, containerEnd);
            if (wsText) {
                result.push({ type: CssTypes.whitespace, value: wsText });
            }
        }
        return result;
    }
    /**
     * Mark position and patch `node.position`.
     */
    function position() {
        const start = preserveFormatting
            ? { ...lexer.getPosition(), offset: lexer.pos }
            : lexer.getPosition();
        return (node) => {
            const end = preserveFormatting
                ? { ...lexer.getPosition(), offset: lexer.pos }
                : lexer.getPosition();
            node.position = new Position(start, end, options?.source || '');
            lexer.skipWhitespace();
            return node;
        };
    }
    /**
     * Error `msg`.
     */
    const errorsList = [];
    function error(msg) {
        const err = new CssParseError(options?.source || '', msg, lexer.lineno, lexer.column, lexer.remaining);
        if (options?.silent) {
            errorsList.push(err);
        }
        else {
            throw err;
        }
    }
    /**
     * Parse stylesheet.
     */
    function stylesheet() {
        const rulesList = rules();
        const result = {
            type: CssTypes.stylesheet,
            stylesheet: {
                source: options?.source,
                rules: insertWhitespace(rulesList, 0, css.length),
                parsingErrors: errorsList,
            },
        };
        return result;
    }
    /**
     * Opening brace.
     */
    function open() {
        return lexer.tryOpenBrace();
    }
    /**
     * Track brace position and call open().
     */
    function openWithPos() {
        const afterOpen = lexer.pos + 1;
        return { ok: lexer.tryOpenBrace(), afterOpen };
    }
    /**
     * Closing brace.
     */
    function close() {
        return lexer.tryCloseBrace();
    }
    /**
     * Parse ruleset.
     */
    function rules() {
        let node;
        const rules = [];
        lexer.skipWhitespace();
        comments(rules);
        while (lexer.hasMore) {
            if (lexer.charCodeAt() === Ch_CLOSE) {
                if (options?.silent) {
                    // Skip stray closing braces at top level
                    error("extra '}'");
                    lexer.consume(1);
                    lexer.skipWhitespace();
                    comments(rules);
                    continue;
                }
                break;
            }
            node = atRule() || rule();
            if (node) {
                rules.push(node);
                comments(rules);
            }
            else {
                if (options?.silent) {
                    // Skip unrecognized character to recover
                    lexer.consume(1);
                    lexer.skipWhitespace();
                    comments(rules);
                    continue;
                }
                break;
            }
        }
        return rules;
    }
    /**
     * Parse whitespace.
     */
    function whitespace() {
        lexer.skipWhitespace();
    }
    /**
     * Parse comments;
     */
    function comments(rules) {
        rules = rules || [];
        let c = comment();
        while (c) {
            rules.push(c);
            c = comment();
        }
        return rules;
    }
    /**
     * Parse comment.
     */
    function comment() {
        const pos = position();
        if (lexer.charCodeAt() !== Ch_SLASH || lexer.charCodeAt(1) !== Ch_STAR) {
            return;
        }
        const m = lexer.matchRegex(re_comment);
        if (!m) {
            return error('End of comment missing');
        }
        return pos({
            type: CssTypes.comment,
            comment: m[0].slice(2, -2),
        });
    }
    /**
     * Parse selector.
     */
    function selector() {
        const absPos = indexOfArrayWithBracketAndQuoteSupport(lexer.input, ['{'], lexer.pos);
        if (absPos === -1 || absPos === lexer.pos) {
            return;
        }
        const selectorStr = lexer.consumeTo(absPos);
        // remove comment in selector;
        const res = trim(selectorStr).replace(commentRegex, '');
        return splitWithBracketAndQuoteSupport(res, [',']).map((v) => trim(v));
    }
    /**
     * Parse declaration.
     */
    function declaration() {
        const pos = position();
        const declStart = preserveFormatting ? lexer.pos : 0;
        // prop
        const propMatch = lexer.matchRegex(re_propName);
        if (!propMatch) {
            return;
        }
        const propValue = trim(propMatch[0]);
        const propClean = propValue.replace(commentRegex, '');
        // :
        if (!lexer.tryColon()) {
            return error("property missing ':'");
        }
        const afterColon = preserveFormatting ? lexer.pos : 0;
        // val
        let value = '';
        let rawValText = '';
        const absEndPos = indexOfArrayWithBracketAndQuoteSupport(lexer.input, [';', '}'], lexer.pos);
        if (absEndPos !== -1) {
            rawValText = lexer.consumeTo(absEndPos);
            value = trim(rawValText).replace(commentRegex, '');
        }
        const ret = pos({
            type: CssTypes.declaration,
            property: propClean,
            value: value,
            ...(preserveFormatting
                ? {
                    rawBetween: css.slice(declStart + propClean.length, afterColon),
                    rawValue: rawValText,
                }
                : {}),
        });
        // ;
        lexer.skipSemicolonAndWhitespace();
        return ret;
    }
    /**
     * Parse declarations (without nesting support).
     * Used by @font-face, @page, keyframes.
     * Returns { decls, afterOpen, beforeClose } when preserveFormatting is true.
     */
    function declarations() {
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            error("missing '{'");
            return;
        }
        const decls = [];
        comments(decls);
        // declarations
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        // In silent mode, try to recover from errors by skipping to next semicolon
        while (options?.silent &&
            lexer.hasMore &&
            lexer.charCodeAt() !== Ch_CLOSE) {
            const semiPos = lexer.input.indexOf(';', lexer.pos);
            const bracePos = lexer.input.indexOf('}', lexer.pos);
            if (semiPos !== -1 && (bracePos === -1 || semiPos < bracePos)) {
                lexer.consumeTo(semiPos + 1);
                whitespace();
                comments(decls);
                decl = declaration();
                while (decl) {
                    decls.push(decl);
                    comments(decls);
                    decl = declaration();
                }
            }
            else {
                break;
            }
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            error("missing '}'");
            return;
        }
        return {
            decls: insertWhitespace(decls, afterOpen, beforeClose),
            afterOpen,
            beforeClose,
        };
    }
    /**
     * Check if the current position looks like a nested rule
     * ('{' appears before ';' and '}' at the top level).
     */
    function looksLikeNestedRule() {
        const pos = lexer.pos;
        const bracePos = indexOfArrayWithBracketAndQuoteSupport(lexer.input, ['{'], pos);
        if (bracePos === -1) {
            return false;
        }
        const semiPos = indexOfArrayWithBracketAndQuoteSupport(lexer.input, [';'], pos);
        const closePos = indexOfArrayWithBracketAndQuoteSupport(lexer.input, ['}'], pos);
        if (semiPos !== -1 && semiPos < bracePos) {
            return false;
        }
        if (closePos !== -1 && closePos < bracePos) {
            return false;
        }
        return true;
    }
    /**
     * Parse rule body with CSS nesting support.
     * Handles declarations, comments, nested rules, and nested at-rules.
     */
    function ruleBody() {
        const items = [];
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            error("missing '{'");
            return;
        }
        comments(items);
        while (lexer.hasMore && lexer.charCodeAt() !== Ch_CLOSE) {
            // nested at-rule
            if (lexer.charCodeAt() === Ch_AT) {
                const ar = atRule();
                if (ar) {
                    items.push(ar);
                    comments(items);
                    continue;
                }
            }
            // nested rule ('{' comes before ';' and '}')
            if (looksLikeNestedRule()) {
                const nestedR = rule();
                if (nestedR) {
                    items.push(nestedR);
                    comments(items);
                    continue;
                }
            }
            // declaration
            const decl = declaration();
            if (decl) {
                items.push(decl);
                comments(items);
                continue;
            }
            // nothing matched — skip to next semicolon or closing brace to recover
            if (options?.silent) {
                const semiPos = lexer.input.indexOf(';', lexer.pos);
                const bracePos = lexer.input.indexOf('}', lexer.pos);
                if (semiPos !== -1 && (bracePos === -1 || semiPos < bracePos)) {
                    lexer.consumeTo(semiPos + 1);
                    whitespace();
                    comments(items);
                    continue;
                }
            }
            break;
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            error("missing '}'");
            return;
        }
        return {
            items: insertWhitespace(items, afterOpen, beforeClose),
            afterOpen,
            beforeClose,
        };
    }
    /**
     * Parse rules, declarations, and nested rules.
     * Used by block at-rules (media, supports, etc.) to support
     * both top-level rules and declarations when nested inside a rule.
     */
    function rulesOrDeclarations(afterOpen) {
        const items = [];
        whitespace();
        comments(items);
        while (lexer.hasMore && lexer.charCodeAt() !== Ch_CLOSE) {
            // at-rule
            if (lexer.charCodeAt() === Ch_AT) {
                const ar = atRule();
                if (ar) {
                    items.push(ar);
                    comments(items);
                    continue;
                }
            }
            // nested rule ('{' comes before ';' and '}')
            if (looksLikeNestedRule()) {
                const r = rule();
                if (r) {
                    items.push(r);
                    comments(items);
                    continue;
                }
            }
            // declaration
            const decl = declaration();
            if (decl) {
                items.push(decl);
                comments(items);
                continue;
            }
            // nothing matched — skip to next semicolon or closing brace to recover
            if (options?.silent) {
                const semiPos = lexer.input.indexOf(';', lexer.pos);
                const bracePos = lexer.input.indexOf('}', lexer.pos);
                if (semiPos !== -1 && (bracePos === -1 || semiPos < bracePos)) {
                    lexer.consumeTo(semiPos + 1);
                    whitespace();
                    comments(items);
                    continue;
                }
            }
            break;
        }
        if (preserveFormatting && afterOpen != null) {
            const beforeClose = lexer.pos;
            return insertWhitespace(items, afterOpen, beforeClose);
        }
        return items;
    }
    /**
     * Parse keyframe.
     */
    function keyframe() {
        const vals = [];
        const pos = position();
        const kfStart = preserveFormatting ? lexer.pos : 0;
        let m = lexer.matchRegex(re_keyframeValue);
        while (m) {
            vals.push(m[1]);
            lexer.tryCommaAndWhitespace();
            m = lexer.matchRegex(re_keyframeValue);
        }
        if (!vals.length) {
            return;
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const parsed = declarations();
        if (!parsed)
            return;
        return pos({
            type: CssTypes.keyframe,
            values: vals,
            declarations: parsed.decls,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(kfStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse keyframes.
     */
    function atKeyframes() {
        const pos = position();
        const kfStart = preserveFormatting ? lexer.pos : 0;
        const m1 = lexer.matchRegex(re_keyframesName);
        if (!m1) {
            return;
        }
        const vendor = m1[1];
        // identifier
        const m2 = lexer.matchRegex(re_identifier);
        if (!m2) {
            return error('@keyframes missing name');
        }
        const name = m2[1];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@keyframes missing '{'");
        }
        const frames = comments();
        let frame = keyframe();
        while (frame) {
            frames.push(frame);
            comments(frames);
            frame = keyframe();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@keyframes missing '}'");
        }
        return pos({
            type: CssTypes.keyframes,
            name: name,
            vendor: vendor,
            keyframes: insertWhitespace(frames, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(kfStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse supports.
     */
    function atSupports() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_supports);
        if (!m) {
            return;
        }
        const supports = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@supports missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@supports missing '}'");
        }
        return pos({
            type: CssTypes.supports,
            supports: supports,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse host.
     */
    function atHost() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_host);
        if (!m) {
            return;
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@host missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@host missing '}'");
        }
        return pos({
            type: CssTypes.host,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse container.
     */
    function atContainer() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_container);
        if (!m) {
            return;
        }
        const container = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@container missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@container missing '}'");
        }
        return pos({
            type: CssTypes.container,
            container: container,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse layer.
     */
    function atLayer() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_layer);
        if (!m) {
            return;
        }
        const layer = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            // Statement form: @layer name;
            // Consume the semicolon so position end includes it
            if (lexer.charCodeAt() === 59) {
                // 59 = ';'
                lexer.consume(1);
            }
            const rawSrc = preserveFormatting
                ? css.slice(atStart, lexer.pos)
                : undefined;
            return pos({
                type: CssTypes.layer,
                layer: layer,
                ...(rawSrc ? { rawSource: rawSrc } : {}),
            });
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@layer missing '}'");
        }
        return pos({
            type: CssTypes.layer,
            layer: layer,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse media.
     */
    function atMedia() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_media);
        if (!m) {
            return;
        }
        const media = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@media missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@media missing '}'");
        }
        return pos({
            type: CssTypes.media,
            media: media,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse custom-media.
     */
    function atCustomMedia() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_customMedia);
        if (!m) {
            return;
        }
        const rawSrc = preserveFormatting
            ? css.slice(atStart, lexer.pos)
            : undefined;
        return pos({
            type: CssTypes.customMedia,
            name: trim(m[1]),
            media: trim(m[2]),
            ...(rawSrc ? { rawSource: rawSrc } : {}),
        });
    }
    /**
     * Parse @page margin box at-rules (@top-left, @bottom-right, @left-middle, etc.).
     */
    function atPageMarginBox() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_pageMarginBox);
        if (!m) {
            return;
        }
        const name = m[1];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error(`@${name} missing '{'`);
        }
        const decls = comments();
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error(`@${name} missing '}'`);
        }
        return pos({
            type: CssTypes.pageMarginBox,
            name: name,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse paged media.
     */
    function atPage() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_page);
        if (!m) {
            return;
        }
        const sel = selector() || [];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@page missing '{'");
        }
        const decls = [];
        comments(decls);
        // declarations and nested at-rules (margin boxes)
        while (lexer.hasMore && lexer.charCodeAt() !== Ch_CLOSE) {
            if (lexer.charCodeAt() === Ch_AT) {
                const ar = atRule();
                if (ar) {
                    decls.push(ar);
                    comments(decls);
                    continue;
                }
            }
            const decl = declaration();
            if (decl) {
                decls.push(decl);
                comments(decls);
                continue;
            }
            break;
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@page missing '}'");
        }
        return pos({
            type: CssTypes.page,
            selectors: sel,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse document.
     */
    function atDocument() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_document);
        if (!m) {
            return;
        }
        const vendor = trim(m[1]);
        const doc = trim(m[2]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@document missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@document missing '}'");
        }
        return pos({
            type: CssTypes.document,
            document: doc,
            vendor: vendor,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse font-face.
     */
    function atFontFace() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_fontFace);
        if (!m) {
            return;
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@font-face missing '{'");
        }
        const decls = comments();
        // declarations
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@font-face missing '}'");
        }
        return pos({
            type: CssTypes.fontFace,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @property.
     */
    function atProperty() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_property);
        if (!m) {
            return;
        }
        const name = m[1];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@property missing '{'");
        }
        const decls = comments();
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@property missing '}'");
        }
        return pos({
            type: CssTypes.property,
            name: name,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @counter-style.
     */
    function atCounterStyle() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_counterStyle);
        if (!m) {
            return;
        }
        const name = m[1];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@counter-style missing '{'");
        }
        const decls = comments();
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@counter-style missing '}'");
        }
        return pos({
            type: CssTypes.counterStyle,
            name: name,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @font-feature-values.
     */
    function atFontFeatureValues() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_fontFeatureValues);
        if (!m) {
            return;
        }
        const fontFamily = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@font-feature-values missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@font-feature-values missing '}'");
        }
        return pos({
            type: CssTypes.fontFeatureValues,
            fontFamily: fontFamily,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @scope.
     */
    function atScope() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_scope);
        if (!m) {
            return;
        }
        const scope = trim(m[1]);
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@scope missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@scope missing '}'");
        }
        return pos({
            type: CssTypes.scope,
            scope: scope,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @view-transition.
     */
    function atViewTransition() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_viewTransition);
        if (!m) {
            return;
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@view-transition missing '{'");
        }
        const decls = comments();
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@view-transition missing '}'");
        }
        return pos({
            type: CssTypes.viewTransition,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse @position-try.
     */
    function atPositionTry() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_positionTry);
        if (!m) {
            return;
        }
        const name = m[1];
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const afterOpen = preserveFormatting ? lexer.pos + 1 : 0;
        if (!open()) {
            return error("@position-try missing '{'");
        }
        const decls = comments();
        let decl = declaration();
        while (decl) {
            decls.push(decl);
            comments(decls);
            decl = declaration();
        }
        const beforeClose = preserveFormatting ? lexer.pos : 0;
        if (!close()) {
            return error("@position-try missing '}'");
        }
        return pos({
            type: CssTypes.positionTry,
            name: name,
            declarations: insertWhitespace(decls, afterOpen, beforeClose),
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse starting style.
     */
    function atStartingStyle() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_startingStyle);
        if (!m) {
            return;
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (!opened) {
            return error("@starting-style missing '{'");
        }
        const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
        if (!close()) {
            return error("@starting-style missing '}'");
        }
        return pos({
            type: CssTypes.startingStyle,
            rules: style,
            ...(preserveFormatting
                ? { rawPrelude: css.slice(atStart, braceOffset) }
                : {}),
        });
    }
    /**
     * Parse import
     */
    function atImport() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_atImport);
        if (!m) {
            return;
        }
        const rawSrc = preserveFormatting
            ? css.slice(atStart, lexer.pos)
            : undefined;
        return pos({
            type: CssTypes.import,
            import: m[1].trim(),
            ...(rawSrc ? { rawSource: rawSrc } : {}),
        });
    }
    /**
     * Parse charset
     */
    function atCharset() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_atCharset);
        if (!m) {
            return;
        }
        const rawSrc = preserveFormatting
            ? css.slice(atStart, lexer.pos)
            : undefined;
        return pos({
            type: CssTypes.charset,
            charset: m[1].trim(),
            ...(rawSrc ? { rawSource: rawSrc } : {}),
        });
    }
    /**
     * Parse namespace
     */
    function atNamespace() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_atNamespace);
        if (!m) {
            return;
        }
        const rawSrc = preserveFormatting
            ? css.slice(atStart, lexer.pos)
            : undefined;
        return pos({
            type: CssTypes.namespace,
            namespace: m[1].trim(),
            ...(rawSrc ? { rawSource: rawSrc } : {}),
        });
    }
    /**
     * Parse generic/unknown at-rule (fallback for any unrecognized at-rule).
     * Handles both block at-rules (@scope { ... }) and statement at-rules (@foo ...;).
     */
    function atGeneric() {
        const pos = position();
        const atStart = preserveFormatting ? lexer.pos : 0;
        const m = lexer.matchRegex(re_genericAtRule);
        if (!m) {
            return;
        }
        const name = m[1];
        // Capture prelude (everything between the name and '{' or ';')
        let prelude = '';
        const preludeEnd = indexOfArrayWithBracketAndQuoteSupport(lexer.input, ['{', ';'], lexer.pos);
        if (preludeEnd !== -1 && preludeEnd > lexer.pos) {
            prelude = trim(lexer.consumeTo(preludeEnd));
        }
        // Block at-rule
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        const { ok: opened, afterOpen } = openWithPos();
        if (opened) {
            const style = rulesOrDeclarations(preserveFormatting ? afterOpen : undefined);
            if (!close()) {
                return error(`@${name} missing '}'`);
            }
            return pos({
                type: CssTypes.atRule,
                name: name,
                prelude: prelude,
                rules: style,
                ...(preserveFormatting
                    ? { rawPrelude: css.slice(atStart, braceOffset) }
                    : {}),
            });
        }
        // Statement at-rule (ends with ';')
        lexer.skipSemicolonAndWhitespace();
        return pos({
            type: CssTypes.atRule,
            name: name,
            prelude: prelude,
        });
    }
    /**
     * Parse at rule.
     */
    function atRule() {
        if (lexer.charCodeAt() !== Ch_AT) {
            return;
        }
        return (atKeyframes() ||
            atMedia() ||
            atCustomMedia() ||
            atSupports() ||
            atImport() ||
            atCharset() ||
            atNamespace() ||
            atDocument() ||
            atPage() ||
            atHost() ||
            atFontFace() ||
            atFontFeatureValues() ||
            atContainer() ||
            atStartingStyle() ||
            atLayer() ||
            atProperty() ||
            atCounterStyle() ||
            atScope() ||
            atViewTransition() ||
            atPositionTry() ||
            atPageMarginBox() ||
            atGeneric());
    }
    /**
     * Parse rule.
     */
    function rule() {
        const pos = position();
        const ruleStart = preserveFormatting ? lexer.pos : 0;
        const sel = selector();
        if (!sel) {
            return error('selector missing');
        }
        const braceOffset = preserveFormatting ? lexer.pos : 0;
        comments();
        const body = ruleBody();
        return pos({
            type: CssTypes.rule,
            selectors: sel,
            declarations: body?.items || [],
            ...(preserveFormatting
                ? { rawPrelude: css.slice(ruleStart, braceOffset) }
                : {}),
        });
    }
    return addParent(stylesheet());
};
/**
 * Trim `str`.
 */
function trim(str) {
    return str ? str.trim() : '';
}
/**
 * Adds non-enumerable parent node reference to each node.
 * Only recurses into array and object properties that can contain child nodes,
 * skipping primitive values and known leaf objects (Position, etc.).
 */
function addParent(obj, parent) {
    const isNode = obj && typeof obj.type === 'string';
    const childParent = isNode ? obj : parent;
    for (const k in obj) {
        const value = obj[k];
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                addParent(value[i], childParent);
            }
        }
        else if (value &&
            typeof value === 'object' &&
            !(value instanceof Position)) {
            addParent(value, childParent);
        }
    }
    if (isNode) {
        Object.defineProperty(obj, 'parent', {
            configurable: true,
            writable: true,
            enumerable: false,
            value: parent || null,
        });
    }
    return obj;
}
export default parse;
