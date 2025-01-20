import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model("ChatRoom", ChatSchema);

export default ChatRoom;
