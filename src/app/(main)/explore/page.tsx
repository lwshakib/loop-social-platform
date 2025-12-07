"use client";

import { Compass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ExplorePage() {
  // Mock data for explore content
  const trendingTopics = [
    { id: 1, name: "Technology", posts: "12.5K" },
    { id: 2, name: "Design", posts: "8.3K" },
    { id: 3, name: "Photography", posts: "15.2K" },
    { id: 4, name: "Art", posts: "9.7K" },
    { id: 5, name: "Travel", posts: "11.1K" },
  ];

  const suggestedUsers = [
    { id: 1, username: "johndoe", name: "John Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john" },
    { id: 2, username: "janedoe", name: "Jane Doe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane" },
    { id: 3, username: "alice", name: "Alice Smith", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice" },
  ];

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Compass className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Explore</h1>
          </div>
          <p className="text-muted-foreground">
            Discover trending topics and connect with new people
          </p>
        </div>

        {/* Trending Topics */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Trending Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
              >
                <h3 className="font-semibold mb-1">#{topic.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {topic.posts} posts
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Users */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Suggested Users</h2>
          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

