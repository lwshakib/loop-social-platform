"use client";

import { Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ReelsPage() {
  // Mock data for reels
  const reels = [
    {
      id: 1,
      username: "creator1",
      name: "Creator One",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=creator1",
      likes: "12.5K",
      comments: "234",
      description: "Amazing sunset view! 🌅",
    },
    {
      id: 2,
      username: "creator2",
      name: "Creator Two",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=creator2",
      likes: "8.3K",
      comments: "156",
      description: "Check out this cool trick!",
    },
    {
      id: 3,
      username: "creator3",
      name: "Creator Three",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=creator3",
      likes: "15.2K",
      comments: "421",
      description: "New recipe I tried today 👨‍🍳",
    },
  ];

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Play className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Reels</h1>
          </div>
          <p className="text-muted-foreground">
            Watch short videos from creators you follow
          </p>
        </div>

        {/* Reels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="group relative aspect-[9/16] rounded-lg overflow-hidden border border-border bg-card cursor-pointer"
            >
              {/* Placeholder for video */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Play className="h-16 w-16 text-primary opacity-50" />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={reel.avatar} />
                    <AvatarFallback>{reel.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {reel.name}
                    </p>
                    <p className="text-xs text-white/70">@{reel.username}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white mb-3 line-clamp-2">
                  {reel.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-white/80">
                  <span>{reel.likes} likes</span>
                  <span>{reel.comments} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no reels) */}
        {reels.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No reels available yet. Check back later!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

