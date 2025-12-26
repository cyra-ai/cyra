/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Embedding utilities for semantic search
 * Uses local transformers for privacy and performance
 */

import { env, pipeline } from '@xenova/transformers';

// Set cache directory to tmp to avoid cluttering project
env.cacheDir = './tmp/embeddings_cache';

let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline
 * Uses a lightweight model optimized for semantic similarity
 */
const getEmbeddingPipeline = async () => {
	if (!embeddingPipeline) {
		console.log('Initializing embedding model...');
		embeddingPipeline = await pipeline(
			'feature-extraction',
			'Xenova/all-MiniLM-L6-v2'
		);
	};
	return embeddingPipeline;
};

/**
 * Generate embedding vector for text
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
	const pipe = await getEmbeddingPipeline();
	const result = await pipe(text, {
		pooling: 'mean',
		normalize: true
	});

	// Convert to array if needed
	if (result.data)
		return Array.from(result.data);
	return Array.from(result);
};

/**
 * Calculate cosine similarity between two embedding vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

	if (magnitudeA === 0 || magnitudeB === 0) return 0;

	return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Serialize embedding vector to JSON string for storage
 */
export const serializeEmbedding = (embedding: number[]): string => {
	return JSON.stringify(embedding);
};

/**
 * Deserialize embedding vector from JSON string
 */
export const deserializeEmbedding = (json: string): number[] => {
	return JSON.parse(json);
};
