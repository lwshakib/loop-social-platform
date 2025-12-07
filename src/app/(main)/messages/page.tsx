"use client";

import { Send, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Mock conversations
  const conversations = [
    {
      id: 1,
      username: "johndoe",
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      lastMessage: "Hey, how are you doing?",
      timestamp: "2m ago",
      unread: 2,
    },
    {
      id: 2,
      username: "janedoe",
      name: "Jane Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
      lastMessage: "Thanks for the help!",
      timestamp: "1h ago",
      unread: 0,
    },
    {
      id: 3,
      username: "alice",
      name: "Alice Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      lastMessage: "See you tomorrow!",
      timestamp: "3h ago",
      unread: 1,
    },
    {
      id: 4,
      username: "bob",
      name: "Bob Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      lastMessage: "That sounds great!",
      timestamp: "1d ago",
      unread: 0,
    },
  ];

  // Mock messages for selected chat
  const messages = selectedChat
    ? [
        {
          id: 1,
          sender: "johndoe",
          text: "Hey, how are you doing?",
          timestamp: "10:30 AM",
          isOwn: false,
        },
        {
          id: 2,
          sender: "you",
          text: "I'm doing great, thanks for asking!",
          timestamp: "10:32 AM",
          isOwn: true,
        },
        {
          id: 3,
          sender: "johndoe",
          text: "That's awesome to hear!",
          timestamp: "10:33 AM",
          isOwn: false,
        },
      ]
    : [];

  const selectedConversation = conversations.find((c) => c.id === selectedChat);

  return (
    <main className="flex-1 min-h-screen bg-background flex">
      {/* Conversations List */}
      <div className="w-full md:w-96 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search messages..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`w-full p-4 border-b border-border hover:bg-accent transition-colors text-left ${
                selectedChat === conversation.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar} />
                  <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">{conversation.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold ml-2 flex-shrink-0">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col hidden md:flex">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation?.avatar} />
                <AvatarFallback>
                  {selectedConversation?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedConversation?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation?.username}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && message.trim()) {
                      // Handle send message
                      setMessage("");
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={() => {
                    if (message.trim()) {
                      // Handle send message
                      setMessage("");
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

