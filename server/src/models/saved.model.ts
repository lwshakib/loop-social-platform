import mongoose from "mongoose";

const savedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to ensure a user can only save a post once
savedSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Index for better query performance
savedSchema.index({ postId: 1, createdAt: -1 });
savedSchema.index({ userId: 1, createdAt: -1 });

const Saved = mongoose.model("Saved", savedSchema);

export default Saved;

