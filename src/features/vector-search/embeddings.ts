// ─── Client-side "embedding" simulation ────────────────────────────────────
//
// This is a lightweight, fully deterministic, offline stand-in for a real
// ML text embedding model. There is no network call and no actual neural
// network involved — instead we use a classic bag-of-hashed-character-
// trigrams technique: every overlapping 3-character window of the input
// text is hashed into a fixed-size bucket, and the resulting histogram
// (L2-normalized) becomes the "vector". Similar strings share many of the
// same trigrams, so cosine similarity between these vectors correlates
// reasonably well with lexical/semantic-ish similarity — good enough for
// local schema discovery without shipping a real model.

import type { SchemaModel } from '../../types/schema';

export const EMBEDDING_DIM = 64;

/**
 * djb2 string hash — small, fast, and well distributed enough for bucketing
 * trigrams into a fixed number of embedding dimensions.
 */
function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // Force unsigned 32-bit
  return hash >>> 0;
}

/**
 * Embeds arbitrary text into a fixed-length `EMBEDDING_DIM` vector using
 * hashed character-trigram frequencies, L2-normalized so that cosine
 * similarity is well-behaved regardless of input length.
 */
export function embedText(text: string): Float32Array {
  const vector = new Float32Array(EMBEDDING_DIM);
  const normalized = text.toLowerCase().trim();

  if (normalized.length === 0) {
    return vector;
  }

  // Pad short strings so even single words still produce trigrams.
  const padded = normalized.length < 3 ? normalized.padEnd(3, ' ') : normalized;

  for (let i = 0; i <= padded.length - 3; i++) {
    const trigram = padded.slice(i, i + 3);
    const bucket = djb2Hash(trigram) % EMBEDDING_DIM;
    vector[bucket] += 1;
  }

  // L2 normalize
  let sumOfSquares = 0;
  for (let i = 0; i < vector.length; i++) sumOfSquares += vector[i] * vector[i];
  const magnitude = Math.sqrt(sumOfSquares);

  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) vector[i] /= magnitude;
  }

  return vector;
}

/**
 * Cosine similarity between two equal-length vectors, in [-1, 1] (in
 * practice [0, 1] for these non-negative trigram-count vectors).
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Embeds a schema model by concatenating its name, field names, field
 * types, and descriptions into a single "document" and embedding that.
 */
export function embedSchemaModel(model: SchemaModel): Float32Array {
  const parts: string[] = [model.name];

  if (model.appLabel) parts.push(model.appLabel);
  if (model.description) parts.push(model.description);

  for (const field of model.fields) {
    parts.push(field.name, field.type);
    if (field.description) parts.push(field.description);
  }

  return embedText(parts.join(' '));
}
