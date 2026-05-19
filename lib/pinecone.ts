import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME || 'loop-reels';

// Only initialize if the key is provided
export const pinecone = apiKey ? new Pinecone({ apiKey }) : null;

/**
 * Upserts a video embedding to Pinecone vector database.
 */
export async function upsertVideoEmbedding(
  videoId: string,
  values: number[],
  metadata: {
    userId: string;
    category?: string;
    createdAt: number;
    contentType?: string;
  }
): Promise<boolean> {
  if (!pinecone) {
    return false;
  }

  try {
    const index = pinecone.index(indexName);
    await index.upsert({
      records: [
        {
          id: videoId,
          values,
          metadata: {
            ...metadata,
            videoId,
          },
        },
      ]
    });
    return true;
  } catch (error) {
    console.error('Error upserting video embedding to Pinecone:', error);
    return false;
  }
}

/**
 * Queries Pinecone for similar videos based on a user preference vector.
 */
export async function querySimilarVideos(
  vector: number[],
  limit: number = 10,
  excludeIds?: string[]
): Promise<string[] | null> {
  if (!pinecone) {
    return null;
  }

  try {
    const index = pinecone.index(indexName);
    
    // Construct filter for exclusions if any
    const filter = excludeIds && excludeIds.length > 0 
      ? { videoId: { $nin: excludeIds } } 
      : undefined;

    const response = await index.query({
      vector,
      topK: limit,
      includeMetadata: true,
      filter,
    });

    if (response.matches) {
      return response.matches.map((match) => match.id);
    }
    return [];
  } catch (error) {
    console.error('Error querying Pinecone vector index:', error);
    return null;
  }
}
