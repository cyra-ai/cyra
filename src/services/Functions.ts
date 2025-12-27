import type { Function } from '../types/function.js';
import fs from 'fs';
import path from 'path';

class Functions {
	private functions: Map<string, Function> = new Map();

	async loadFunctions(): Promise<void> {
		const files = fs.readdirSync(path.resolve(process.cwd(), 'src', 'functions'));
		const functionFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

		for (const file of functionFiles) {
			const modulePath = path.resolve(process.cwd(), 'src', 'functions', file);
			const funcModule = await import(modulePath);
			const func: Function = funcModule.default;
			this.registerFunction(func);
		};

		console.log(`Loaded ${this.functions.size} functions`);
	};

	registerFunction(func: Function): void {
		// Validate function structure
		if (!func.name || typeof func.name !== 'string')
			throw new Error('Function must have a valid name (string)');
		if (!func.description || typeof func.description !== 'string')
			throw new Error(`Function "${func.name}" must have a valid description (string)`);
		if (!func.parameters || typeof func.parameters !== 'object')
			throw new Error(`Function "${func.name}" must have parameters object`);
		if (!func.parameters.type || !func.parameters.properties)
			throw new Error(`Function "${func.name}" parameters must have type and properties`);
		if (!func.execute || typeof func.execute !== 'function')
			throw new Error(`Function "${func.name}" must have an execute method`);

		this.functions.set(func.name, func);
		console.log(`Registered function: ${func.name}`);
	};

	getFunctions(): Function[] {
		return Array.from(this.functions.values());
	};

	getToolDefinitions() {
		return this.getFunctions().map(func => ({
			...func,
			execute: undefined  // Exclude execute method for tool definitions
		}));
	};

	async executeFunction(name: string, args?: Record<string, unknown>): Promise<string> {
		const func = this.functions.get(name);
		if (!func)
			throw new Error(`Function not found: ${name}`);

		console.log(`Executing function: ${name}`, args);
		return await func.execute(args);
	};

	hasFunction(name: string): boolean {
		return this.functions.has(name);
	};
};

const functions = new Functions();

// Load all functions when the module is imported
await functions.loadFunctions();

export default functions;
