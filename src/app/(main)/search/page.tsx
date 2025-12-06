"use client";

import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">
            Find people, posts, and content
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Search Results Placeholder */}
        <div className="space-y-4">
          {searchQuery ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Start typing to search for people, posts, and content
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

