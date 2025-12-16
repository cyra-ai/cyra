import type { FunctionDeclaration } from '@google/genai';

export interface CyraTool extends FunctionDeclaration {
	execute: (args?: Record<string, any>) => Promise<{ output: string } | { error: string }>;
}