"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  toggleLike,
  toggleUnlike,
  toggleBookmark,
  toggleUnbookmark,
} from "@/lib/post-actions";
import { useSocialStore } from "@/context";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type Reel = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string;
  type: "reel";
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

const ReelsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: 8 }).map((_, idx) => (
      <Skeleton key={idx} className="aspect-9/16 w-full rounded-xl" />
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

export default function ReelsPage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reels
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/reels");

        if (!response.ok) {
          throw new Error("Failed to fetch reels");
        }

        const result = await response.json();
        if (result.data) {
          setReels(result.data);
        }
      } catch (error) {
        console.error("Error fetching reels:", error);
        setReels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReels();
  }, []);

  // Handle like/unlike with optimistic updates
  const handleLike = async (reelId: string, isLiked: boolean) => {
    if (!currentUser) return;

    const previousReels = reels;

    // Optimistically update UI immediately
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              isLiked: !isLiked,
              likesCount: isLiked
                ? Math.max(0, reel.likesCount - 1)
                : reel.likesCount + 1,
            }
          : reel
      )
    );

    // Make API call in background
    try {
      if (isLiked) {
        await toggleUnlike(reelId);
      } else {
        await toggleLike(reelId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setReels(previousReels);
    }
  };

  // Handle bookmark/unbookmark with optimistic updates
  const handleBookmark = async (reelId: string, isSaved: boolean) => {
    if (!currentUser) return;

    const previousReels = reels;

    // Optimistically update UI immediately
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId ? { ...reel, isSaved: !isSaved } : reel
      )
    );

    // Make API call in background
    try {
      if (isSaved) {
        await toggleUnbookmark(reelId);
      } else {
        await toggleBookmark(reelId);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Revert on error
      setReels(previousReels);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Play className="h-6 w-6 sm:h-8 sm:w-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">Reels</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Watch short videos from creators
            </p>
          </div>
          <ReelsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Play className="h-6 w-6 sm:h-8 sm:w-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">Reels</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Watch short videos from creators
          </p>
        </div>

        {/* Reels Grid */}
        {reels.length === 0 ? (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No reels available yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {reels.map((reel) => {
              const avatarUrl =
                reel.user.imageUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.user.username}`;

              return (
                <div
                  key={reel.id}
                  className="group relative aspect-9/16 rounded-lg overflow-hidden border border-border bg-card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/reels/${reel.id}`)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative w-full h-full">
                    <video
                      src={reel.imageUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="h-12 w-12 sm:h-16 sm:w-16 text-white opacity-80" />
                    </div>
                  </div>

                  {/* Overlay Content */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {/* User Info */}
                    <Link
                      href={`/${reel.user.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 mb-3 pointer-events-auto"
                    >
                      <Avatar className="h-8 w-8 border-2 border-background shrink-0">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>
                          {reel.user.name[0]?.toUpperCase() ||
                            reel.user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {reel.user.name}
                        </p>
                        <p className="text-xs text-white/70 truncate">
                          {reel.user.username}
                        </p>
                      </div>
                    </Link>

                    {/* Description */}
                    {reel.content && (
                      <p className="text-sm text-white mb-3 line-clamp-2">
                        {reel.content}
                      </p>
                    )}

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-white/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(reel.id, reel.isLiked || false);
                          }}
                          className={`flex items-center gap-1.5 transition-colors pointer-events-auto ${
                            reel.isLiked
                              ? "text-red-500"
                              : "text-white/80 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              reel.isLiked ? "fill-current" : ""
                            }`}
                          />
                          <span>{reel.likesCount || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/reels/${reel.id}`);
                          }}
                          className="flex items-center gap-1.5 text-white/80 hover:text-white pointer-events-auto"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{reel.commentsCount || 0}</span>
                        </button>
                        <span className="text-white/60">
                          {formatTimeAgo(reel.createdAt)}
                        </span>
                      </div>
                      {currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(reel.id, reel.isSaved || false);
                          }}
                          className={`transition-colors pointer-events-auto ${
                            reel.isSaved
                              ? "text-yellow-500"
                              : "text-white/80 hover:text-yellow-500"
                          }`}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              reel.isSaved ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
