"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocialStore } from "@/context";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
  getPostComments,
  createComment,
} from "@/lib/post-actions";
import { Bookmark, Heart, MessageCircle, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import VideoPlayer from "../../_components/video-player";
import { Skeleton } from "@/components/ui/skeleton";

type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string;
  type: "text" | "image" | "reel";
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    imageUrl: string;
  };
};

type Comment = {
  id: string;
  userId: string;
  postId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    imageUrl: string;
  };
  replies?: Comment[];
};

const PostPageSkeleton = () => (
  <div className="flex-1 overflow-y-auto">
    <div className="flex flex-col md:flex-row min-h-full md:min-h-[calc(100vh-4rem)] max-w-6xl mx-auto">
      <Skeleton className="relative w-full md:w-3/5 min-h-[400px] md:min-h-[600px] md:max-h-[calc(100vh-4rem)] rounded-none" />
      <div className="flex-1 bg-card border-l border-border p-4 flex flex-col">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="space-y-3 py-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-10 w-16 rounded-full" />
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CommentsSkeleton = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    ))}
  </div>
);

// Helper function to format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const postId = params?.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [morePosts, setMorePosts] = useState<Post[]>([]);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setPost(null);
            return;
          }
          throw new Error("Failed to fetch post");
        }

        const result = await response.json();
        if (result.data) {
          setPost(result.data);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Fetch comments when post is loaded
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId || !post) return;

      try {
        setIsLoadingComments(true);
        const result = await getPostComments(postId);
        if (result.data) {
          setComments(result.data);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [postId, post?.id]);

  // Fetch more posts from the same user
  useEffect(() => {
    const fetchMorePosts = async () => {
      if (!post?.user?.username) return;

      try {
        setIsLoadingMorePosts(true);
        const response = await fetch(
          `/api/users/${post.user.username}/posts?type=posts`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch more posts");
        }

        const result = await response.json();
        if (result.data) {
          // Filter out the current post and limit to 6 posts
          const filteredPosts = result.data
            .filter((p: Post) => p.id !== postId)
            .slice(0, 6);
          setMorePosts(filteredPosts);
        }
      } catch (error) {
        console.error("Error fetching more posts:", error);
        setMorePosts([]);
      } finally {
        setIsLoadingMorePosts(false);
      }
    };

    fetchMorePosts();
  }, [post?.user?.username, postId]);

  // Handle like/unlike with optimistic updates
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return;

    const previousPost = post;

    // Optimistically update UI immediately
    if (isLiked) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: false,
              likesCount: Math.max(0, prev.likesCount - 1),
            }
          : null
      );
    } else {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: true,
              likesCount: prev.likesCount + 1,
            }
          : null
      );
    }

    // Make API call in background
    try {
      if (isLiked) {
        await toggleUnlike(postId);
      } else {
        await toggleLike(postId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setPost(previousPost);
    }
  };

  // Handle bookmark/unbookmark with optimistic updates
  const handleBookmark = async (postId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const previousPost = post;

    // Optimistically update UI immediately
    setPost((prev) => (prev ? { ...prev, isSaved: !isSaved } : null));

    // Make API call in background
    try {
      if (isSaved) {
        await toggleUnbookmark(postId);
      } else {
        await toggleBookmark(postId);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Revert on error
      setPost(previousPost);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!post || !commentContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const result = await createComment(post.id, commentContent.trim());
      if (result.data) {
        setComments((prev) => [result.data, ...prev]);
        setCommentContent("");
        setPost((prev) =>
          prev
            ? {
                ...prev,
                commentsCount: prev.commentsCount + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentId: string) => {
    if (!post || !replyContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const result = await createComment(
        post.id,
        replyContent.trim(),
        parentId
      );
      if (result.data) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), result.data],
                }
              : comment
          )
        );
        setReplyingTo(null);
        setReplyContent("");
        setPost((prev) =>
          prev
            ? {
                ...prev,
                commentsCount: prev.commentsCount + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <PostPageSkeleton />;
  }

  // Show error state if post not found
  if (!post) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post not found</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const avatarUrl =
    post.user.imageUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col md:flex-row min-h-full md:min-h-[calc(100vh-4rem)] max-w-6xl mx-auto">
        {/* Media Section */}
        <div className="relative w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden min-h-[400px] md:min-h-[600px] md:max-h-[calc(100vh-4rem)]">
          {post.imageUrl ? (
            post.type === "reel" ? (
              <div className="w-full h-full flex items-center justify-center">
                <VideoPlayer
                  src={post.imageUrl}
                  videoId={post.id}
                  containerClassName="w-full h-full max-h-[calc(100vh-4rem)]"
                  className="w-full h-full object-contain"
                  intersectionObserverId={post.id}
                  autoPlay={true}
                  loop={true}
                  initialMuted={false}
                  showControls={true}
                />
              </div>
            ) : (
              <img
                src={post.imageUrl}
                alt="Post"
                className="w-full h-full object-contain max-h-[calc(100vh-4rem)]"
              />
            )
          ) : (
            <div className="text-center p-8 text-white">
              <p className="text-sm">{post.content || "Post"}</p>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-2/5 flex flex-col md:max-h-[calc(100vh-4rem)] border-l bg-background">
          <div className="shrink-0">
            {/* Header with back button */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link
                href={`/${post.user.username}`}
                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>
                    {post.user.name[0]?.toUpperCase() ||
                      post.user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{post.user.username}</p>
                </div>
              </Link>
            </div>

            {post.content && (
              <div className="p-4 border-b">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(post.createdAt)}
                </p>
              </div>
            )}

            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id, post.isLiked || false)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.isLiked
                        ? "text-red-500"
                        : "text-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart
                      className={`h-6 w-6 ${
                        post.isLiked ? "fill-current" : ""
                      }`}
                    />
                    <span className="text-sm font-semibold">
                      {post.likesCount || 0}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-foreground">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm font-semibold">
                      {post.commentsCount || 0}
                    </span>
                  </button>
                </div>
                <button
                  onClick={() => handleBookmark(post.id, post.isSaved || false)}
                  className={`transition-colors ${
                    post.isSaved
                      ? "text-yellow-500"
                      : "text-foreground hover:text-yellow-500"
                  }`}
                >
                  <Bookmark
                    className={`h-6 w-6 ${post.isSaved ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto min-h-0 md:max-h-[calc(100vh-4rem-300px)]">
            {isLoadingComments ? (
              <CommentsSkeleton />
            ) : comments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.user.imageUrl} />
                        <AvatarFallback>
                          {comment.user.name[0]?.toUpperCase() ||
                            comment.user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {comment.user.username}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(comment.createdAt)}
                              </p>
                              {currentUser && (
                                <button
                                  onClick={() => {
                                    setReplyingTo(
                                      replyingTo === comment.id
                                        ? null
                                        : comment.id
                                    );
                                    setReplyContent("");
                                  }}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {replyingTo === comment.id
                                    ? "Cancel"
                                    : "Reply"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reply input */}
                        {replyingTo === comment.id && (
                          <div className="mt-2 ml-10 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                placeholder="Add a reply..."
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !e.shiftKey &&
                                    replyContent.trim()
                                  ) {
                                    e.preventDefault();
                                    handleSubmitReply(comment.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={
                                  !replyContent.trim() || isSubmittingComment
                                }
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-6 space-y-3 border-l-2 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarImage src={reply.user.imageUrl} />
                                  <AvatarFallback>
                                    {reply.user.name[0]?.toUpperCase() ||
                                      reply.user.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold">
                                    {reply.user.username}
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimeAgo(reply.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input - Fixed at bottom */}
          {currentUser && (
            <div className="shrink-0 p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      commentContent.trim()
                    ) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmittingComment}
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* More Posts from Same User */}
      {morePosts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t">
          <h2 className="text-lg font-semibold mb-4">
            More from {post.user.username}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {morePosts.map((morePost) => (
              <Link
                key={morePost.id}
                href={`/p/${morePost.id}`}
                className="group relative aspect-square bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
              >
                {morePost.imageUrl ? (
                  morePost.type === "reel" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={morePost.imageUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="h-8 w-8 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={morePost.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {morePost.content || "Post"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-4 text-white">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 fill-current" />
                      <span className="text-sm font-semibold">
                        {morePost.likesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 fill-current" />
                      <span className="text-sm font-semibold">
                        {morePost.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
