import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for likes count
postSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

// Virtual for comments count
postSchema.virtual("commentsCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

// Virtual for likes (populate likes)
postSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "postId",
});

// Virtual for comments (populate comments)
postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
});

// Index for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
