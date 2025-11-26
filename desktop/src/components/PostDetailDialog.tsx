import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Heart, Loader2, MessageCircle, Reply } from "lucide-react";
import { ReactNode } from "react";

export type PostDialogUser = {
  id?: string;
  firstName?: string;
  surName?: string;
  username?: string;
  profileImage?: string;
};

export type PostDialogPost = {
  id: string;
  caption?: string;
  url?: string;
  type: "text" | "image" | "video";
  likesCount: number;
  commentsCount: number;
  createdAt?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  user?: PostDialogUser;
};

export type PostDialogComment = {
  id: string;
  userId: string;
  user?: PostDialogUser;
  comment: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  replies?: PostDialogComment[];
  replyCount?: number;
};

export interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostDialogPost | null;
  likedPosts: Set<string>;
  savedPosts: Set<string>;
  comments: PostDialogComment[];
  isLoadingComments: boolean;
  loadingReplies: Set<string>;
  repliesHasMore: Record<string, boolean>;
  replyingTo: string | null;
  replyText: Record<string, string>;
  newComment: string;
  isSubmittingComment: boolean;
  formatTimeAgo: (date?: string) => string;
  formatNumber: (value?: number) => string;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onSubmitComment: (parentId?: string) => void;
  onReplyToggle: (commentId: string) => void;
  onReplyTextChange: (commentId: string, value: string) => void;
  onLoadReplies: (commentId: string) => void;
  onLoadMoreReplies: (commentId: string) => void;
  onNewCommentChange: (value: string) => void;
  onNavigateToProfile?: (username: string) => void;
  renderMedia?: (post: PostDialogPost) => ReactNode;
}

const renderDefaultMedia = (post: PostDialogPost) => {
  if (post.url) {
    if (post.type === "video") {
      return (
        <video
          src={post.url}
          controls
          autoPlay
          className="w-full h-full object-contain max-h-[95vh]"
        />
      );
    }
    return (
      <img
        src={post.url}
        alt={post.caption || "post"}
        className="w-full h-full object-contain max-h-[95vh]"
      />
    );
  }

  return (
    <div className="text-center text-white p-6">
      {post.caption || "Post"}
    </div>
  );
};

export function PostDetailDialog({
  open,
  onOpenChange,
  post,
  likedPosts,
  savedPosts,
  comments,
  isLoadingComments,
  loadingReplies,
  repliesHasMore,
  replyingTo,
  replyText,
  newComment,
  isSubmittingComment,
  formatTimeAgo,
  formatNumber,
  onLike,
  onSave,
  onSubmitComment,
  onReplyToggle,
  onReplyTextChange,
  onLoadReplies,
  onLoadMoreReplies,
  onNewCommentChange,
  onNavigateToProfile,
  renderMedia,
}: PostDetailDialogProps) {
  if (!post) {
    return null;
  }

  const handleNavigate = (username?: string) => {
    if (username && onNavigateToProfile) {
      onNavigateToProfile(username);
    }
  };

  const isPostLiked =
    likedPosts.has(post.id) || Boolean(post.isLiked);
  const isPostSaved =
    savedPosts.has(post.id) || Boolean(post.isSaved);

  const mediaContent = renderMedia
    ? renderMedia(post)
    : renderDefaultMedia(post);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden w-full max-w-[1200px] lg:max-w-[90vw] h-[95vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Post preview</DialogTitle>
          <DialogDescription>View post details</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col lg:flex-row h-full">
          <div className="w-full lg:w-1/2 bg-black flex items-center justify-center">
            {mediaContent}
          </div>
          <div className="w-full lg:w-1/2 flex flex-col border-l bg-background">
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar
                className="h-9 w-9 cursor-pointer"
                onClick={() => handleNavigate(post.user?.username)}
              >
                <AvatarImage src={post.user?.profileImage} />
                <AvatarFallback>
                  {post.user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {post.user?.username || "unknown"}
                </p>
                {post.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(post.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {post.caption && (
              <div className="px-4 py-3 border-b text-sm whitespace-pre-wrap">
                {post.caption}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => {
                  if (!comment.user) {
                    return null;
                  }

                  const isReplying = replyingTo === comment.id;
                  const isLoadingReplies = loadingReplies.has(comment.id);
                  const hasMoreReplies = repliesHasMore[comment.id];

                  return (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <Avatar
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => handleNavigate(comment.user?.username)}
                        >
                          <AvatarImage
                            src={comment.user.profileImage}
                            alt={comment.user.username}
                          />
                          <AvatarFallback>
                            {comment.user.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm cursor-pointer hover:underline"
                              onClick={() => handleNavigate(comment.user?.username)}
                            >
                              {comment.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <button
                              className="hover:text-primary flex items-center gap-1"
                              onClick={() => onReplyToggle(comment.id)}
                            >
                              <Reply className="h-3 w-3" />
                              Reply
                            </button>
                            {(comment.replyCount || 0) >
                              (comment.replies?.length || 0) && (
                              <button
                                className="hover:text-primary"
                                onClick={() => onLoadReplies(comment.id)}
                                disabled={isLoadingReplies}
                              >
                                {isLoadingReplies
                                  ? "Loading..."
                                  : `View replies (${Math.max(
                                      (comment.replyCount || 0) -
                                        (comment.replies?.length || 0),
                                      0
                                    )})`}
                              </button>
                            )}
                          </div>

                          {isReplying && (
                            <div className="mt-2 flex gap-2">
                              <Input
                                placeholder={`Reply to @${comment.user.username}`}
                                value={replyText[comment.id] || ""}
                                onChange={(e) =>
                                  onReplyTextChange(comment.id, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    onSubmitComment(comment.id);
                                  }
                                }}
                                className="text-sm"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReplyToggle(comment.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l space-y-3">
                              {comment.replies.map((reply) => {
                                if (!reply.user) return null;
                                return (
                                  <div key={reply.id} className="flex gap-3">
                                    <Avatar
                                      className="h-6 w-6 cursor-pointer"
                                      onClick={() =>
                                        handleNavigate(reply.user?.username)
                                      }
                                    >
                                      <AvatarImage src={reply.user.profileImage} />
                                      <AvatarFallback>
                                        {reply.user.username?.[0]?.toUpperCase() ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs cursor-pointer hover:underline"
                                          onClick={() =>
                                            handleNavigate(reply.user?.username)
                                          }
                                        >
                                          {reply.user.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTimeAgo(reply.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm">{reply.comment}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {hasMoreReplies && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-primary"
                                  onClick={() => onLoadMoreReplies(comment.id)}
                                  disabled={isLoadingReplies}
                                >
                                  {isLoadingReplies
                                    ? "Loading..."
                                    : "View more replies"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onLike(post.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`h-6 w-6 ${
                        isPostLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </button>
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <button
                  onClick={() => onSave(post.id)}
                  className="hover:scale-110 transition-transform"
                >
                  <Bookmark
                    className={`h-6 w-6 ${
                      isPostSaved ? "fill-primary text-primary" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm font-semibold">
                {formatNumber(post.likesCount)} likes
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitComment();
                    }
                  }}
                  disabled={isSubmittingComment}
                />
                <Button
                  onClick={() => onSubmitComment()}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

