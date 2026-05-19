# Reels Vector Recommendation System

We have implemented a production-grade, hybrid vector recommender system to serve relevant "next video" content to users watching Reels.

---

## 1. What We Have Done

1. **Database Schema Updates**:
   - Added `embeddingJson` field to the `Post` table in PostgreSQL to store unit-normalized 768-dimensional video content embeddings directly in the database.
   - Added the `WatchEvent` table to track real-time user engagement metrics (watch duration in seconds, completion rates).
   - Generated client types (`pnpm prisma generate`) and successfully synchronized changes with Neon PostgreSQL database (`pnpm prisma db push`).

2. **Embedding & Similarity Module (`lib/embeddings.ts`)**:
   - Configured semantic feature extraction for text captions and metadata to produce stable 768-dimensional embeddings.
   - Supports **Hugging Face Feature Extraction API** dynamically (e.g. `sentence-transformers/all-mpnet-base-v2` for 768-dimensional embeddings) if `HUGGINGFACE_API_KEY` is present.
   - Falls back gracefully to a high-speed local dense vector generator if the external API key is absent.
   - Implemented cosine similarity (dot product of L2-normalized vectors) to measure content matching.

3. **Pinecone Vector Database Wrapper (`lib/pinecone.ts`)**:
   - Configured official `@pinecone-database/pinecone` client SDK.
   - Gracefully disables Pinecone query/upsert if `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` are missing, reverting automatically to localized database-driven similarity ranking.

4. **Interactive Tracking Endpoint (`/api/reels/interactions`)**:
   - Added a POST API endpoint to register client-side watch metrics (`postId`, `duration`, `completed`).

5. **Asynchronous Vector Indexing (`/api/posts` creation)**:
   - When a user uploads a new reel, the backend automatically generates a 768-dimensional content embedding, updates the post's database record, and indexes it asynchronously to Pinecone.

6. **Ranking Engine (`/api/reels/recommendations`)**:
   - Upgraded the reels feed to dynamically build a personalized **User Preference Vector** on-the-fly and rank the candidate pool.

---

## 2. How the Recommendation Flow Works

The system operates on a **multi-stage candidate retrieval and ranking pipeline** matching modern production standards:

```
  [User Action]
        ↓
  Update User History (Likes, Bookmarks, Watches)
        ↓
  Build 768-Dim Preference Vector (Weighted Sum)
        ↓
  Candidate Generation (Pinecone Query / PostgreSQL Filter)
        ↓
  Vector Scoring (Cosine Similarity * Popularity Boost)
        ↓
  Re-ranking (Explore vs. Exploit Shuffle)
        ↓
  Signed R2 URLs + API Response
```

### Stage 1: Building the User Preference Vector ($\vec{P}$)

When a user requests their reels feed, we fetch their historical interaction signals. We then construct their dynamic preference vector by accumulating video embeddings ($\vec{V}_i$) weighted by interaction strengths:

- **Liked Reels**: weight = $+2.0$
- **Bookmarked Reels**: weight = $+3.0$
- **Completed Watch Events**: weight = $+4.0$
- **Skipped Reels** (watched for less than 3 seconds): weight = $-1.5$ (punishes/represses matching topics)
- **Standard Watch Events**: weight = $+1.0$

We then L2-normalize the resulting vector:
$$\vec{P}_{norm} = \frac{\vec{P}}{\|\vec{P}\|}$$

### Stage 2: Candidate Generation

- **With Pinecone**: We query Pinecone with $\vec{P}_{norm}$, filtering out already-watched videos (`excludeIds`). Pinecone returns the top matches based on high-dimensional index distance.
- **Without Pinecone (Fallback)**: We query PostgreSQL to fetch candidate reels and rank them in-memory.

### Stage 3: Scoring & Ranking

We compute the score for each candidate:
$$\text{Score} = \text{Similarity}(\vec{P}_{norm}, \vec{V}_{\text{candidate}}) \times \text{Popularity Boost}$$
$$\text{Popularity Boost} = 1.0 + 0.1 \times \ln(1 + \text{Likes} + \text{Comments})$$
This ensures that user affinity is the main driver, but highly popular/engaging reels receive a minor boost.

### Stage 4: Re-ranking & Diversification

- **Exploration vs. Exploitation**: We shuffle $10\%$ of the feed using a random probability window, allowing fresh reels to escape filtering bubbles and resolving the cold-start problem.
- **Looping**: If the user finishes watching all available reels, the system automatically recycles historical items to sustain circular scrolling.
