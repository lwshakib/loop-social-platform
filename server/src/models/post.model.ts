import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
},{
    timestamps: true,
    versionKey: false,
});

const Post = mongoose.model("Post", postSchema);

export default Post;