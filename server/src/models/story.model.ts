import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
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
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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

// TTL index to automatically delete stories after 24 hours
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for better query performance
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ createdAt: -1 });

const Story = mongoose.model("Story", storySchema);

export default Story;

