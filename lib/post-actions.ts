// Client-side API call functions for posts
// These functions make fetch calls and don't import any database code

export async function toggleLike(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to like post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
}

export async function toggleUnlike(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unlike post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling unlike:", error);
    throw error;
  }
}

export async function toggleBookmark(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/bookmark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to bookmark post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw error;
  }
}

export async function toggleUnbookmark(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/bookmark`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to unbookmark post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling unbookmark:", error);
    throw error;
  }
}

export async function getPostComments(postId: string) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch comments");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, parentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create comment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
}
