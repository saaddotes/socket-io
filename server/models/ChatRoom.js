import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  lastUpdated: { type: Date, default: Date.now },
});

const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);

export default ChatRoom;
