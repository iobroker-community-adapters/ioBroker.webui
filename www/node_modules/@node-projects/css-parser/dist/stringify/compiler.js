import { CssTypes, } from '../type.js';
class Compiler {
    level = 0;
    indentation = '  ';
    compress = false;
    identity = false;
    removeEmptyRules = false;
    constructor(options) {
        if (typeof options?.indent === 'string') {
            this.indentation = options?.indent;
        }
        if (options?.compress) {
            this.compress = true;
        }
        if (options?.identity) {
            this.identity = true;
        }
        if (options?.removeEmptyRules) {
            this.removeEmptyRules = true;
        }
    }
    // We disable no-unused-vars for _position. We keep position for potential reintroduction of source-map
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emit(str, _position) {
        return str;
    }
    /**
     * Increase, decrease or return current indentation.
     */
    indent(level) {
        this.level = this.level || 1;
        if (level) {
            this.level += level;
            return '';
        }
        return this.level > 1 ? this.indentation.repeat(this.level - 1) : '';
    }
    visit(node) {
        switch (node.type) {
            case CssTypes.stylesheet:
                return this.stylesheet(node);
            case CssTypes.rule:
                return this.rule(node);
            case CssTypes.declaration:
                return this.declaration(node);
            case CssTypes.comment:
                return this.comment(node);
            case CssTypes.whitespace:
                return this.whitespace(node);
            case CssTypes.container:
                return this.container(node);
            case CssTypes.charset:
                return this.charset(node);
            case CssTypes.counterStyle:
                return this.counterStyle(node);
            case CssTypes.document:
                return this.document(node);
            case CssTypes.customMedia:
                return this.customMedia(node);
            case CssTypes.fontFace:
                return this.fontFace(node);
            case CssTypes.fontFeatureValues:
                return this.fontFeatureValues(node);
            case CssTypes.host:
                return this.host(node);
            case CssTypes.import:
                return this.import(node);
            case CssTypes.keyframes:
                return this.keyframes(node);
            case CssTypes.keyframe:
                return this.keyframe(node);
            case CssTypes.layer:
                return this.layer(node);
            case CssTypes.media:
                return this.media(node);
            case CssTypes.namespace:
                return this.namespace(node);
            case CssTypes.page:
                return this.page(node);
            case CssTypes.pageMarginBox:
                return this.pageMarginBox(node);
            case CssTypes.positionTry:
                return this.positionTry(node);
            case CssTypes.property:
                return this.property(node);
            case CssTypes.scope:
                return this.scope(node);
            case CssTypes.startingStyle:
                return this.startingStyle(node);
            case CssTypes.supports:
                return this.supports(node);
            case CssTypes.viewTransition:
                return this.viewTransition(node);
            case CssTypes.atRule:
                return this.genericAtRule(node);
        }
    }
    mapVisit(nodes, delim) {
        let buf = '';
        delim = delim || '';
        for (let i = 0, length = nodes.length; i < length; i++) {
            const str = this.visit(nodes[i]);
            if (str) {
                if (delim && buf) {
                    buf += this.emit(delim);
                }
                buf += str;
            }
        }
        return buf;
    }
    /**
     * Emit a block at-rule that contains nested rules (e.g. @media, @supports, @container).
     */
    rulesBlock(header, rules, position, rawPrelude) {
        if (this.identity && rawPrelude) {
            this.indent(1);
            const result = this.emit(rawPrelude, position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const filteredRules = this.filterEmptyRules(this.stripWhitespace(rules));
        if (this.compress) {
            return (this.emit(header, position) +
                this.emit('{') +
                this.mapVisit(filteredRules) +
                this.emit('}'));
        }
        return (this.emit(`${this.indent()}${header}`, position) +
            this.emit(` {\n${this.indent(1)}`) +
            this.mapVisit(filteredRules, '\n\n') +
            this.emit(`\n${this.indent(-1)}${this.indent()}}`));
    }
    /**
     * Emit a block at-rule that contains declarations (e.g. @font-face, @property).
     */
    declsBlock(header, declarations, position, rawPrelude) {
        if (this.identity && rawPrelude) {
            this.indent(1);
            const result = this.emit(rawPrelude, position) +
                this.emit('{') +
                this.identityVisitBlock(declarations, 'decls') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const stripped = this.stripWhitespace(declarations);
        if (this.compress) {
            return (this.emit(header, position) +
                this.emit('{') +
                this.mapVisit(stripped) +
                this.emit('}'));
        }
        return (this.emit(`${header} `, position) +
            this.emit('{\n') +
            this.emit(this.indent(1)) +
            this.mapVisit(stripped, '\n') +
            this.emit(this.indent(-1)) +
            this.emit('\n}'));
    }
    compile(node) {
        if (this.identity) {
            return this.identityCompile(node);
        }
        if (this.compress) {
            return this.filterEmptyRules(this.stripWhitespace(node.stylesheet.rules))
                .map(this.visit, this)
                .join('');
        }
        return this.stylesheet(node);
    }
    /**
     * Identity mode: walk the AST including whitespace nodes.
     * Falls back to beautified output when whitespace nodes are not available.
     */
    identityCompile(node) {
        const rules = node.stylesheet.rules;
        const hasWhitespace = rules.some((r) => r.type === CssTypes.whitespace);
        if (!hasWhitespace) {
            // Fallback to beautified when preserveFormatting was not used
            return this.stylesheet(node);
        }
        return this.identityVisitBlock(rules, 'stylesheet');
    }
    /**
     * Visit stylesheet node.
     */
    stylesheet(node) {
        return this.mapVisit(this.filterEmptyRules(this.stripWhitespace(node.stylesheet.rules)), '\n\n');
    }
    /**
     * Strip whitespace nodes from an array (used in beautified/compressed modes).
     */
    stripWhitespace(nodes) {
        return nodes.filter((n) => n.type !== CssTypes.whitespace);
    }
    /**
     * Filter out empty rules when removeEmptyRules is enabled.
     */
    filterEmptyRules(rules) {
        if (!this.removeEmptyRules) {
            return rules;
        }
        return rules.filter((rule) => {
            if (rule.type === CssTypes.rule) {
                const decls = rule.declarations.filter((d) => d.type !== CssTypes.whitespace);
                return decls.length > 0;
            }
            return true;
        });
    }
    /**
     * Check whether a node was newly created (not parsed from source).
     * New nodes lack the raw formatting properties set by the parser.
     */
    isNewNode(node) {
        switch (node.type) {
            case CssTypes.whitespace:
                return false;
            case CssTypes.comment:
                return !node.position;
            case CssTypes.declaration:
                return node.rawBetween == null;
            case CssTypes.rule:
                return node.rawPrelude == null;
            default:
                if ('rawPrelude' in node)
                    return !node.rawPrelude;
                if ('rawSource' in node)
                    return !node.rawSource;
                return !node.position;
        }
    }
    /**
     * Visit block children in identity mode, formatting newly added nodes
     * with beautified output while preserving original formatting for
     * existing nodes.
     *
     * @param nodes    - The child nodes to visit
     * @param context  - 'decls' for declaration blocks, 'rules' for nested
     *                   rule blocks (e.g. @media), 'stylesheet' for top-level
     */
    identityVisitBlock(nodes, context) {
        const filtered = this.filterEmptyRules(nodes);
        // Fast path: no new nodes – visit normally
        if (!filtered.some((n) => this.isNewNode(n))) {
            return this.mapVisit(filtered);
        }
        let buf = '';
        const needsDoubleNewline = context === 'rules' || context === 'stylesheet';
        for (let i = 0; i < filtered.length; i++) {
            const node = filtered[i];
            if (!this.isNewNode(node)) {
                buf += this.visit(node);
                continue;
            }
            // ── New node: add proper separator before it ──
            // Check whether the buffer already ends with \n (possibly followed
            // by spaces that were originally the closing-brace indent).  If so,
            // trim those trailing spaces – the beautified fallback of the new
            // node will supply the correct indentation.
            const lastNl = buf.lastIndexOf('\n');
            const hasTrailingNewline = lastNl >= 0 && buf.slice(lastNl + 1).trim() === '';
            if (hasTrailingNewline) {
                buf = buf.slice(0, lastNl + 1);
            }
            else if (buf.length === 0 && context !== 'stylesheet') {
                // First child in a block – add newline after opening brace
                buf += '\n';
            }
            else if (buf.length > 0) {
                buf += '\n';
            }
            if (needsDoubleNewline && buf.length > 1 && !buf.endsWith('\n\n')) {
                buf += '\n';
            }
            // Visit the node (uses beautified fallback since raw props are absent)
            const str = this.visit(node);
            if (str)
                buf += str;
        }
        // Add trailing newline + closing-brace indent when the last meaningful
        // node is new (blocks only, not the top-level stylesheet)
        if (context !== 'stylesheet') {
            const lastMeaningful = [...filtered]
                .reverse()
                .find((n) => n.type !== CssTypes.whitespace);
            if (lastMeaningful &&
                this.isNewNode(lastMeaningful) &&
                buf.length > 0 &&
                !buf.endsWith('\n')) {
                buf += '\n';
                // Indent for the closing brace (one level less than current)
                this.indent(-1);
                buf += this.indent();
                this.indent(1);
            }
        }
        return buf;
    }
    /**
     * Visit whitespace node.
     */
    whitespace(node) {
        if (this.identity) {
            return this.emit(node.value);
        }
        // In beautified/compressed mode, whitespace nodes are stripped before visiting
        return '';
    }
    /**
     * Visit comment node.
     */
    comment(node) {
        if (this.compress) {
            return this.emit('', node.position);
        }
        const indent = this.identity && node.position ? '' : this.indent();
        return this.emit(`${indent}/*${node.comment}*/`, node.position);
    }
    /**
     * Visit container node.
     */
    container(node) {
        return this.rulesBlock(`@container ${node.container}`, node.rules, node.position, node.rawPrelude);
    }
    /**
     * Visit container node.
     */
    layer(node) {
        if (this.identity && node.rawPrelude && node.rules) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(node.rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        if (this.identity && !node.rules && node.rawSource) {
            return this.emit(node.rawSource, node.position);
        }
        const rules = node.rules
            ? this.stripWhitespace(node.rules)
            : undefined;
        if (this.compress) {
            return (this.emit(`@layer ${node.layer}`, node.position) +
                (rules ? this.emit('{') + this.mapVisit(rules) + this.emit('}') : ';'));
        }
        return (this.emit(`${this.indent()}@layer ${node.layer}`, node.position) +
            (rules
                ? this.emit(` {\n${this.indent(1)}`) +
                    this.mapVisit(rules, '\n\n') +
                    this.emit(`\n${this.indent(-1)}${this.indent()}}`)
                : ';'));
    }
    /**
     * Visit import node.
     */
    import(node) {
        if (this.identity && node.rawSource) {
            return this.emit(node.rawSource, node.position);
        }
        return this.emit(`@import ${node.import};`, node.position);
    }
    /**
     * Visit media node.
     */
    media(node) {
        return this.rulesBlock(`@media ${node.media}`, node.rules, node.position, node.rawPrelude);
    }
    /**
     * Visit document node.
     */
    document(node) {
        const doc = `@${node.vendor || ''}document ${node.document}`;
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(node.rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const rules = this.stripWhitespace(node.rules);
        if (this.compress) {
            return (this.emit(doc, node.position) +
                this.emit('{') +
                this.mapVisit(rules) +
                this.emit('}'));
        }
        return (this.emit(doc, node.position) +
            this.emit(`  {\n${this.indent(1)}`) +
            this.mapVisit(rules, '\n\n') +
            this.emit(`${this.indent(-1)}\n}`));
    }
    /**
     * Visit charset node.
     */
    charset(node) {
        if (this.identity && node.rawSource) {
            return this.emit(node.rawSource, node.position);
        }
        return this.emit(`@charset ${node.charset};`, node.position);
    }
    /**
     * Visit namespace node.
     */
    namespace(node) {
        if (this.identity && node.rawSource) {
            return this.emit(node.rawSource, node.position);
        }
        return this.emit(`@namespace ${node.namespace};`, node.position);
    }
    /**
     * Visit starting-style node.
     */
    startingStyle(node) {
        return this.rulesBlock('@starting-style', node.rules, node.position, node.rawPrelude);
    }
    /**
     * Visit supports node.
     */
    supports(node) {
        return this.rulesBlock(`@supports ${node.supports}`, node.rules, node.position, node.rawPrelude);
    }
    /**
     * Visit keyframes node.
     */
    keyframes(node) {
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(node.keyframes, 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const frames = this.stripWhitespace(node.keyframes);
        if (this.compress) {
            return (this.emit(`@${node.vendor || ''}keyframes ${node.name}`, node.position) +
                this.emit('{') +
                this.mapVisit(frames) +
                this.emit('}'));
        }
        return (this.emit(`@${node.vendor || ''}keyframes ${node.name}`, node.position) +
            this.emit(` {\n${this.indent(1)}`) +
            this.mapVisit(frames, '\n') +
            this.emit(`${this.indent(-1)}}`));
    }
    /**
     * Visit keyframe node.
     */
    keyframe(node) {
        const decls = node.declarations;
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(decls, 'decls') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const stripped = this.stripWhitespace(decls);
        if (this.compress) {
            return (this.emit(node.values.join(','), node.position) +
                this.emit('{') +
                this.mapVisit(stripped) +
                this.emit('}'));
        }
        return (this.emit(this.indent()) +
            this.emit(node.values.join(', '), node.position) +
            this.emit(` {\n${this.indent(1)}`) +
            this.mapVisit(stripped, '\n') +
            this.emit(`${this.indent(-1)}\n${this.indent()}}\n`));
    }
    /**
     * Visit page node.
     */
    page(node) {
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(node.declarations, 'decls') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const decls = this.stripWhitespace(node.declarations);
        if (this.compress) {
            const sel = node.selectors.length ? node.selectors.join(', ') : '';
            return (this.emit(`@page ${sel}`, node.position) +
                this.emit('{') +
                this.mapVisit(decls) +
                this.emit('}'));
        }
        const sel = node.selectors.length ? `${node.selectors.join(', ')} ` : '';
        return (this.emit(`@page ${sel}`, node.position) +
            this.emit('{\n') +
            this.emit(this.indent(1)) +
            this.mapVisit(decls, '\n') +
            this.emit(this.indent(-1)) +
            this.emit('\n}'));
    }
    /**
     * Visit @page margin box node (@top-left, @bottom-right, etc.).
     */
    pageMarginBox(node) {
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(node.declarations, 'decls') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const decls = this.stripWhitespace(node.declarations);
        if (this.compress) {
            return (this.emit(`@${node.name}`, node.position) +
                this.emit('{') +
                this.mapVisit(decls) +
                this.emit('}'));
        }
        return (this.emit(`${this.indent()}@${node.name} `, node.position) +
            this.emit('{\n') +
            this.emit(this.indent(1)) +
            this.mapVisit(decls, '\n') +
            this.emit(this.indent(-1)) +
            this.emit(`\n${this.indent()}}`));
    }
    /**
     * Visit font-face node.
     */
    fontFace(node) {
        return this.declsBlock('@font-face', node.declarations, node.position, node.rawPrelude);
    }
    /**
     * Visit host node.
     */
    host(node) {
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(node.rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const rules = this.stripWhitespace(node.rules);
        if (this.compress) {
            return (this.emit('@host', node.position) +
                this.emit('{') +
                this.mapVisit(rules) +
                this.emit('}'));
        }
        return (this.emit('@host', node.position) +
            this.emit(` {\n${this.indent(1)}`) +
            this.mapVisit(rules, '\n\n') +
            this.emit(`${this.indent(-1)}\n}`));
    }
    /**
     * Visit custom-media node.
     */
    customMedia(node) {
        if (this.identity && node.rawSource) {
            return this.emit(node.rawSource, node.position);
        }
        return this.emit(`@custom-media ${node.name} ${node.media};`, node.position);
    }
    /**
     * Visit @property node.
     */
    property(node) {
        return this.declsBlock(`@property ${node.name}`, node.declarations, node.position, node.rawPrelude);
    }
    /**
     * Visit @counter-style node.
     */
    counterStyle(node) {
        return this.declsBlock(`@counter-style ${node.name}`, node.declarations, node.position, node.rawPrelude);
    }
    /**
     * Visit @font-feature-values node.
     */
    fontFeatureValues(node) {
        return this.rulesBlock(`@font-feature-values ${node.fontFamily}`, node.rules, node.position, node.rawPrelude);
    }
    /**
     * Visit @scope node.
     */
    scope(node) {
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(node.rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const prelude = node.scope ? ` ${node.scope}` : '';
        return this.rulesBlock(`@scope${prelude}`, this.stripWhitespace(node.rules), node.position);
    }
    /**
     * Visit @view-transition node.
     */
    viewTransition(node) {
        return this.declsBlock('@view-transition', node.declarations, node.position, node.rawPrelude);
    }
    /**
     * Visit @position-try node.
     */
    positionTry(node) {
        return this.declsBlock(`@position-try ${node.name}`, node.declarations, node.position, node.rawPrelude);
    }
    /**
     * Visit generic at-rule node (fallback for any unrecognized at-rule).
     */
    genericAtRule(node) {
        if (this.identity && node.rawPrelude && node.rules) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(this.filterEmptyRules(node.rules), 'rules') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const prelude = node.prelude ? ` ${node.prelude}` : '';
        const rules = node.rules
            ? this.stripWhitespace(node.rules)
            : undefined;
        if (this.compress) {
            return (this.emit(`@${node.name}${prelude}`, node.position) +
                (rules ? this.emit('{') + this.mapVisit(rules) + this.emit('}') : ';'));
        }
        if (!rules) {
            return this.emit(`${this.indent()}@${node.name}${prelude};`, node.position);
        }
        const hasNestedRules = rules.some((r) => r.type !== CssTypes.declaration && r.type !== CssTypes.comment);
        const delim = hasNestedRules ? '\n\n' : '\n';
        return (this.emit(`${this.indent()}@${node.name}${prelude}`, node.position) +
            this.emit(hasNestedRules ? ` {\n${this.indent(1)}` : ' {\n') +
            this.emit(hasNestedRules ? '' : this.indent(1)) +
            this.mapVisit(rules, delim) +
            this.emit(hasNestedRules
                ? `\n${this.indent(-1)}${this.indent()}}`
                : `${this.indent(-1)}\n${this.indent()}}`));
    }
    /**
     * Visit rule node.
     */
    rule(node) {
        const decls = node.declarations;
        if (this.identity && node.rawPrelude) {
            this.indent(1);
            const result = this.emit(node.rawPrelude, node.position) +
                this.emit('{') +
                this.identityVisitBlock(decls, 'decls') +
                this.emit('}');
            this.indent(-1);
            return result;
        }
        const stripped = this.stripWhitespace(decls);
        if (this.compress) {
            if (this.removeEmptyRules && !stripped.length) {
                return '';
            }
            return (this.emit(node.selectors.join(','), node.position) +
                this.emit('{') +
                this.mapVisit(stripped) +
                this.emit('}'));
        }
        const indent = this.indent();
        if (!stripped.length) {
            if (this.removeEmptyRules) {
                return '';
            }
            return (this.emit(node.selectors
                .map((s) => {
                return indent + s;
            })
                .join(',\n'), node.position) + this.emit(' {}'));
        }
        return (this.emit(node.selectors
            .map((s) => {
            return indent + s;
        })
            .join(',\n'), node.position) +
            this.emit(' {\n') +
            this.emit(this.indent(1)) +
            this.mapVisit(stripped, '\n') +
            this.emit(this.indent(-1)) +
            this.emit(`\n${this.indent()}}`));
    }
    /**
     * Visit declaration node.
     */
    declaration(node) {
        if (this.identity && node.rawBetween != null) {
            return this.emit(`${node.property}${node.rawBetween}${node.rawValue ?? node.value}`, node.position);
        }
        if (this.compress) {
            return (this.emit(`${node.property}:${node.value}`, node.position) +
                this.emit(';'));
        }
        if (node.property === 'grid-template-areas') {
            const indent = this.indent();
            const pad = indent.length + node.property.length + 2; // 2 for ": "
            const parts = node.value.split('\n');
            const aligned = parts
                .map((p, i) => (i === 0 ? p : ' '.repeat(pad) + p.trimStart()))
                .join('\n');
            return (this.emit(indent) +
                this.emit(`${node.property}: ${aligned}`, node.position) +
                this.emit(';'));
        }
        return (this.emit(this.indent()) +
            this.emit(`${node.property}: ${node.value}`, node.position) +
            this.emit(';'));
    }
}
export default Compiler;
