import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

/**
 * Rules for all JSDOC plugin usages
 */
const jsdocRules = {
    'jsdoc/require-returns': 0,
    'jsdoc/tag-lines': ['error', 'never', { startLines: 1 }],
    'jsdoc/no-blank-blocks': ['error', { enableFixer: true }],
    'jsdoc/require-jsdoc': [
        'warn',
        {
            publicOnly: true,
            require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true },
            contexts: ['TSInterfaceDeclaration', 'TSMethodSignature', 'TSPropertySignature'],
        },
    ],
};

/**
 * Rules for all unicorn plugin usages
 */
const unicornRules = {
    'unicorn/prefer-module': 'error',
    'unicorn/prefer-node-protocol': 'error',
};

/**
 * General rules, applied to all files
 */
const generalRules = {
    curly: ['error'],
    'brace-style': 'error',
    'dot-notation': 'off',
    'quote-props': ['error', 'as-needed'],
    'no-else-return': 'error',
    // https://eslint.org/docs/latest/rules/prefer-template
    // Enforce the use of template literals instead of string concatenation: "Hello, " + name + "!" => `Hello, ${name}!`
    'prefer-template': 'error',
    'no-duplicate-imports': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
        },
    ],
};

/** General TypeScript rules */
const tsRules = {
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-use-before-define': [
        'error',
        {
            functions: false,
            typedefs: false,
            classes: false,
        },
    ],
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-inferrable-types': [
        'error',
        {
            ignoreProperties: true,
            ignoreParameters: true,
        },
    ],
    '@typescript-eslint/ban-ts-comment': [
        'error',
        {
            'ts-expect-error': false,
            'ts-ignore': true,
            'ts-nocheck': true,
            'ts-check': false,
        },
    ],
    '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
            allowNumber: true,
            allowBoolean: true,
            allowAny: true,
            allowNullish: true,
        },
    ],
    '@typescript-eslint/no-misused-promises': [
        'error',
        {
            checksVoidReturn: false,
        },
    ],
    '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
            allowTypedFunctionExpressions: true,
            allowExpressions: true,
        },
    ],
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-for-in-array': 'warn',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        {
            allowArgumentsExplicitlyTypedAsAny: true,
        },
    ],
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/dot-notation': [
        'error',
        {
            allowPrivateClassPropertyAccess: true,
            allowProtectedClassPropertyAccess: true,
        },
    ],
    '@typescript-eslint/no-unsafe-declaration-merging': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
};

/** Separate config for .js files which is applied internally */
const plainJsConfig = {
    ...tseslint.configs.disableTypeChecked,
    rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        '@typescript-eslint/no-require-imports': 'off',
    }
}

/** @type {import("eslint").Linter.FlatConfig[]} */
export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    jsdoc.configs['flat/recommended-typescript'],
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        plugins: { jsdoc },
        rules: jsdocRules,
    },
    {
        rules: generalRules,
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: tsRules,
    },
    {
        files: ['**/*.js'],
        ...plainJsConfig,
    },
);

/**
 * Additional rules for ESM modules
 */
export const esmConfig = [
    {
        plugins: { unicorn: eslintPluginUnicorn },
        rules: unicornRules,
    },
];

/**
 * Config for React projects
 */
export const reactConfig = [
    {
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            // https://eslint.org/docs/latest/rules/class-methods-use-this
            // Make a warning if the method should be `static` and enforce that class methods utilize this
            'class-methods-use-this': 'warn',
            // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unused-class-component-methods.md
            // Disallow declaring unused methods of component class
            'react/no-unused-class-component-methods': 'warn',
            // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/prop-types.md
            // Disallow missing props validation in a React component definition.
            // ! Typescript uses no PropType
            'react/prop-types': 'off',
            // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-is-mounted.md
            // Disallow usage of isMounted.
            // ! It was a warning, but no isMounted used, so disable this.
            'react/no-is-mounted': 'off',
            // https://typescript-eslint.io/rules/restrict-template-expressions/
            // Enforce template literal expressions to be of a string type.
            '@typescript-eslint/restrict-template-expressions': 'off',
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                ecmaVersion: 12,
                // for @typescript/eslint-parser
                jsxPragma: 'React',
            },
        },
        settings: {
            react: {
                // Automatically detect the React version
                version: 'detect',
            },
        },
    },
];
