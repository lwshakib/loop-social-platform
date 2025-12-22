"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSocialStore } from "@/context";
import { Upload, X, Smile } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function CreatePage() {
  const router = useRouter();
  const currentUser = useSocialStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const [createPostData, setCreatePostData] = useState({
    caption: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error("Invalid file type", {
          description: "Please upload an image or video file",
        });
        return;
      }

      // Validate file size (e.g., 50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("File too large", {
          description: "Please upload a file smaller than 50MB",
        });
        return;
      }

      setCreatePostData((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error("Invalid file type", {
          description: "Please upload an image or video file",
        });
        return;
      }
      setCreatePostData((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSubmit = async () => {
    try {
      // Check if user is authenticated
      if (!currentUser) {
        toast.error("Authentication Required", {
          description: "You must be logged in to create a post.",
        });
        return;
      }

      // Determine post type
      let postType: "text" | "image" | "reel" = "text";
      let fileUrl = "";

      // Upload file if exists
      if (createPostData.file) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Check file type
          if (createPostData.file.type.startsWith("image/")) {
            postType = "image";
          } else if (createPostData.file.type.startsWith("video/")) {
            postType = "reel";
          }

          // Get Cloudinary signature
          const { data: response } = await axios.get(
            "/api/cloudinary/signature",
            {
              params: {
                folder: "loop-social-platform",
              },
            }
          );

          // Extract signature data from response
          const signature = response.data;

          // Determine upload endpoint based on file type
          const uploadType = postType === "reel" ? "video" : "image";
          const uploadApi = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${uploadType}/upload`;

          // Create FormData
          const formData = new FormData();
          formData.append("file", createPostData.file);
          formData.append("api_key", signature.apiKey);
          formData.append("timestamp", signature.timestamp.toString());
          formData.append("folder", signature.folder);
          formData.append("signature", signature.signature);

          // Upload to Cloudinary
          const { data: uploadResponse } = await axios.post(
            uploadApi,
            formData,
            {
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(progress);
                }
              },
            }
          );

          fileUrl = uploadResponse.secure_url || uploadResponse.url;

          if (!fileUrl) {
            throw new Error("No URL returned from Cloudinary");
          }

          setIsUploading(false);
          setUploadProgress(0);
        } catch (error) {
          setIsUploading(false);
          setUploadProgress(0);
          console.error("Error uploading file:", error);
          const errorMessage =
            axios.isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : error instanceof Error
              ? error.message
              : "Failed to upload file. Please try again.";
          toast.error("Upload Failed", {
            description: errorMessage,
          });
          return;
        }
      }

      // Prepare request body
      const requestBody: {
        content: string;
        url?: string;
        type: "text" | "image" | "reel";
      } = {
        content: createPostData.caption.trim() || "",
        type: postType,
      };

      if (fileUrl) {
        requestBody.url = fileUrl;
      }

      // Create post via API
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Post Created", {
          description: "Your post has been created successfully!",
        });

        // Reset form
        setCreatePostData({
          caption: "",
          file: null,
          preview: null,
        });

        // Navigate to home or profile
        router.push("/");
      } else {
        const error = await response.json();
        toast.error("Failed to Create Post", {
          description:
            error.error || "Failed to create post. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setIsUploading(false);
      toast.error("Error", {
        description: "An error occurred while creating the post.",
      });
    }
  };

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (createPostData.preview) {
        URL.revokeObjectURL(createPostData.preview);
      }
    };
  }, [createPostData.preview]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEmojiPickerOpen &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  const avatarUrl =
    currentUser?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      currentUser?.username || "user"
    }`;

  return (
    <main className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
          <p className="text-muted-foreground">
            Share your thoughts, images, or videos with the community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Drag and Drop Field */}
          <div className="space-y-2">
            <Label className="text-base">Media</Label>
            <div
              className="border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[400px]"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {createPostData.preview ? (
                <div className="space-y-4 w-full h-full flex flex-col items-center justify-center p-4">
                  {createPostData.file?.type.startsWith("video/") ? (
                    <video
                      src={createPostData.preview}
                      className="max-h-[400px] max-w-full rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={createPostData.preview}
                      alt="Preview"
                      className="max-h-[400px] max-w-full rounded-lg object-contain"
                    />
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreatePostData((prev) => ({
                          ...prev,
                          file: null,
                          preview: null,
                        }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center p-8">
                  <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drag and drop an image or video here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: JPG, PNG, GIF, MP4
                    </p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Caption Field */}
          <div className="flex flex-col h-full min-h-[400px]">
            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  {currentUser?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm truncate">
                {currentUser?.username || "User"}
              </span>
            </div>

            {/* Caption Textarea Container */}
            <div className="flex-1 flex flex-col relative bg-muted/30 rounded-lg overflow-hidden">
              <Textarea
                id="caption"
                placeholder="Write a caption..."
                value={createPostData.caption}
                onChange={(e) =>
                  setCreatePostData((prev) => ({
                    ...prev,
                    caption: e.target.value,
                  }))
                }
                maxLength={2200}
                className="flex-1 w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none border-0"
                rows={10}
              />

              {/* Bottom Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
                {/* Emoji Button - Simple implementation */}
                <Button
                  ref={emojiButtonRef}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    // Simple emoji insertion - can be enhanced with emoji picker library
                    const emojis = ["😀", "❤️", "👍", "🔥", "🎉", "💯"];
                    const randomEmoji =
                      emojis[Math.floor(Math.random() * emojis.length)];
                    setCreatePostData((prev) => ({
                      ...prev,
                      caption: prev.caption + randomEmoji,
                    }));
                  }}
                >
                  <Smile className="h-5 w-5" />
                </Button>

                {/* Character Count */}
                <span className="text-xs text-muted-foreground">
                  {createPostData.caption.length.toLocaleString()}/2,200
                </span>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  (!createPostData.caption.trim() && !createPostData.file) ||
                  isUploading
                }
                className="flex-1"
              >
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Create Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
