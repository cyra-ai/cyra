// Ignore this file, I configure it to my liking
// MY PROJECT MY RULES

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import type { Linter } from 'eslint';

const customRule: any = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce semicolons after control structures',
			recommended: true
		},
		fixable: 'code',
		messages: {
			missingSemicolon: 'Missing semicolon after closing brace'
		}
	},
	create: (context: { sourceCode: any; report: (arg0: { node: any; messageId: string; fix: (fixer: { insertTextAfter: (arg0: any, arg1: string) => any; }) => any; }) => void; }) => {
		const sourceCode = context.sourceCode;
		return {
			'IfStatement:exit': checkControlStructure,
			'ForStatement:exit': checkControlStructure,
			'ForInStatement:exit': checkControlStructure,
			'ForOfStatement:exit': checkControlStructure,
			'WhileStatement:exit': checkControlStructure,
			'DoWhileStatement:exit': checkControlStructure,
			'TryStatement:exit': checkControlStructure,
			'SwitchStatement:exit': checkControlStructure
		};

		function checkControlStructure(node: any) {
			const tokens = sourceCode.getTokens(node);
			const lastToken = tokens[tokens.length - 1];

			if (lastToken && lastToken.value === '}') {
				const nextToken = sourceCode.getTokenAfter(lastToken);
				if (!nextToken || nextToken.value !== ';') {
					context.report({
						node,
						messageId: 'missingSemicolon',
						fix: (fixer: { insertTextAfter: (arg0: any, arg1: string) => any; }) => fixer.insertTextAfter(lastToken, ';')
					});
				}
			}
		}
	}
};

const unnecesaryCurlyRule: any = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Remove unnecessary curly braces for single-statement blocks',
			recommended: true
		},
		fixable: 'code',
		messages: {
			unnecessaryBraces:
				'Unnecessary curly braces for single-statement block. Remove them.'
		}
	},
	create: (context: any) => {
		return {
			'IfStatement:exit': checkSingleStatement,
			'ForStatement:exit': checkSingleStatement,
			'ForInStatement:exit': checkSingleStatement,
			'ForOfStatement:exit': checkSingleStatement,
			'WhileStatement:exit': checkSingleStatement,
			'DoWhileStatement:exit': checkSingleStatement
		};

		function checkSingleStatement(node: any) {
			const body = node.consequent || node.body;
			// Check if body is a block with a single statement
			if (body?.type === 'BlockStatement' && body.body?.length === 1) {
				context.report({
					node: body,
					messageId: 'unnecessaryBraces'
				});
			}
		}
	}
};

const config: Linter.Config[] = [
	{
		ignores: ['dist', 'node_modules', '*.js', '**/*.js']
	},
	{
		files: ['src/**/*.ts', 'src/**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
				project: './tsconfig.json'
			},
			globals: {
				console: 'readonly',
				process: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin as any,
			custom: {
				rules: {
					'semicolon-after-control': customRule,
					'no-unnecessary-braces': unnecesaryCurlyRule
				}
			}
		},
		rules: {
			...js.configs.recommended.rules,
			...tsPlugin.configs.recommended.rules,
			'@typescript-eslint/explicit-module-boundary-types': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
			semi: ['error', 'always'],
			quotes: ['error', 'single'],
			indent: ['error', 'tab'],
			'comma-dangle': ['error', 'never'],
			curly: 'off',
			'custom/no-unnecessary-braces': 'error',
			'no-trailing-spaces': 'error',
			'custom/semicolon-after-control': 'error',
			'func-style': ['error', 'expression']
		}
	}
];

export default config;
