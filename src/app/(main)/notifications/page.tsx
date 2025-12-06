"use client";

import { Bell, Heart, MessageCircle, UserPlus, UserCheck, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NotificationType = "like" | "comment" | "follow" | "follow_request" | "mention";

interface Notification {
  id: number;
  type: NotificationType;
  user: {
    username: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  relatedContent?: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Mock notifications
  const allNotifications: Notification[] = [
    {
      id: 1,
      type: "like",
      user: {
        username: "johndoe",
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      },
      content: "liked your post",
      timestamp: "5m ago",
      isRead: false,
      relatedContent: "Amazing sunset view! 🌅",
    },
    {
      id: 2,
      type: "comment",
      user: {
        username: "janedoe",
        name: "Jane Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
      },
      content: "commented on your post",
      timestamp: "15m ago",
      isRead: false,
      relatedContent: "Great shot! Where was this taken?",
    },
    {
      id: 3,
      type: "follow",
      user: {
        username: "alice",
        name: "Alice Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      },
      content: "started following you",
      timestamp: "1h ago",
      isRead: true,
    },
    {
      id: 4,
      type: "follow_request",
      user: {
        username: "bob",
        name: "Bob Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      },
      content: "wants to follow you",
      timestamp: "2h ago",
      isRead: false,
    },
    {
      id: 5,
      type: "like",
      user: {
        username: "charlie",
        name: "Charlie Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
      },
      content: "liked your post",
      timestamp: "3h ago",
      isRead: true,
      relatedContent: "Check out this cool trick!",
    },
    {
      id: 6,
      type: "mention",
      user: {
        username: "diana",
        name: "Diana Prince",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
      },
      content: "mentioned you in a comment",
      timestamp: "5h ago",
      isRead: false,
      relatedContent: "@you This is exactly what I was looking for!",
    },
  ];

  const notifications =
    filter === "unread"
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications;

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "follow_request":
        return <UserCheck className="h-5 w-5 text-orange-500" />;
      case "mention":
        return <ThumbsUp className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="h-6 px-2 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              className="rounded-full"
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer ${
                  !notification.isRead ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.user.avatar} />
                        <AvatarFallback>
                          {notification.user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">
                            {notification.user.name}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {notification.content}
                          </span>
                        </p>
                      </div>
                    </div>

                    {notification.relatedContent && (
                      <p className="text-sm text-muted-foreground ml-10 mb-2">
                        {notification.relatedContent}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground ml-10">
                      {notification.timestamp}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

