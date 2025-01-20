import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    message: String,
    status: {
      type: String,
      enum: ["sent", "received", "read"],
      default: "sent",
    },
  },
  { timeStamp: true }
);

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
