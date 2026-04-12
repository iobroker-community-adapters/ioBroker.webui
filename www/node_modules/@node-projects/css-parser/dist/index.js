import { default as parseFn } from './parse/index.js';
import { default as stringifyFn } from './stringify/index.js';
export const parse = parseFn;
export const stringify = stringifyFn;
export * from './CssParseError.js';
export * from './CssPosition.js';
export * from './type.js';
export default { parse, stringify };
