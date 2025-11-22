import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Compound index to ensure a user can only follow another user once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Prevent users from following themselves
followSchema.pre("save", function (next) {
  if (this.followerId.toString() === this.followingId.toString()) {
    const error = new Error("Users cannot follow themselves");
    return next(error);
  }
  next();
});

// Index for better query performance
followSchema.index({ followerId: 1, createdAt: -1 });
followSchema.index({ followingId: 1, createdAt: -1 });

const Follow = mongoose.model("Follow", followSchema);

export default Follow;

