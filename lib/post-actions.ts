/**
 * Post Interaction API Helpers
 * This file contains purely client-side functions that trigger API endpoints
 * for interacting with posts (liking, bookmarking, commenting).
 *
 * Note: These do NOT contain database logic; they act as a bridge to the server.
 */

/**
 * toggleLike
 * Sends a POST request to create a 'like' record for a specific post.
 * @param postId Unique identifier of the post to like.
 * @returns The server response indicating success or updated like count.
 */
export async function toggleLike(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * toggleUnlike
 * Sends a DELETE request to remove a 'like' record for a specific post.
 * @param postId Unique identifier of the post to unlike.
 */
export async function toggleUnlike(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlike post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling unlike:', error);
    throw error;
  }
}

/**
 * toggleBookmark
 * Triggers a POST request to save a post to the user's personal bookmarks.
 * @param postId Unique identifier of the post to save.
 */
export async function toggleBookmark(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to bookmark post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

/**
 * toggleUnbookmark
 * Sends a DELETE request to remove a post from the user's bookmarks.
 * @param postId Unique identifier of the post to remove.
 */
export async function toggleUnbookmark(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/bookmark`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unbookmark post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling unbookmark:', error);
    throw error;
  }
}

/**
 * getPostComments
 * Fetches all top-level and nested comments for a specific post.
 * @param postId Unique identifier of the post.
 */
export async function getPostComments(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * createComment
 * Triggers an API call to publish a new text comment on a post.
 * @param postId Target post for the comment.
 * @param content The text body of the comment.
 * @param parentId Optional ID if this is a reply to another comment.
 */
export async function createComment(postId: string, content: string, parentId?: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}
