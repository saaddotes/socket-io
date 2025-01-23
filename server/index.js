import http from "http";
import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import ChatRoom from "./models/ChatRoom.js";
import auth from "./routes/auth.js";
import "dotenv/config";
import cors from "cors";
import User from "./models/User.js";
import Message from "./models/Message.js";

const { MONGODB_URI, ORIGIN, PORT } = process.env;
const app = express();

app.use(cors());

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("DB connected successfully"))
  .catch((error) => console.log("Failed to connect : " + error));

const users = {};

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected succesfully", socket.id, " => ", userId);
  users[userId] = socket.id;

  socket.on("start-chat", async ({ senderId, receiverId }, callback) => {
    try {
      const participants = [senderId, receiverId].sort();
      let chatRoom = await ChatRoom.findOne({
        participants: participants,
      });

      let prevMessages = [];

      if (!chatRoom) {
        chatRoom = new ChatRoom({
          participants: participants,
          lastMessage: null,
          lastUpdated: new Date(),
        });
        await chatRoom.save();
      } else {
        await Message.updateMany(
          {
            chatRoomId: chatRoom._id,
            senderId: { $ne: senderId },
          },
          { $set: { status: "delivered" } }
        );

        prevMessages = await Message.find({ chatRoomId: chatRoom._id }).lean();
      }

      const receiverSocketId = users[receiverId];

      socket.to(receiverSocketId).emit("update-status", { prevMessages });

      callback({
        success: true,
        message: "Joined to Chat success",
        chatRoom,
        prevMessages,
      });
    } catch (err) {
      callback({ success: false, message: "Failed to start chat.", err });
      console.error("Error in start-chat:", err);
    }
  });

  socket.on(
    "send-message",
    async ({ senderId, receiverId, messageText }, callback) => {
      try {
        const participants = [senderId, receiverId].sort();
        let chatRoom = await ChatRoom.findOne({
          participants: participants,
        });

        if (!chatRoom) {
          chatRoom = new ChatRoom({ participants: participants });
          await chatRoom.save();
        }

        const message = new Message({
          chatRoomId: chatRoom._id,
          senderId,
          message: messageText,
          status: users[receiverId] ? "delivered" : "sent",
        });
        await message.save();

        chatRoom.lastMessage = message._id;
        chatRoom.lastUpdated = new Date();
        await chatRoom.save();

        if (users[receiverId]) {
          socket.to(users[receiverId]).emit("new-message", { message });
          console.log("User online");
        }

        callback({
          success: true,
          message: "Message sent successfully!",
          newMessage: message,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        callback({ success: false, message: "Failed to send message." });
      }
    }
  );

  // socket.on("message-delivered", async ({ messageId }) => {
  //   try {
  //     const message = await Message.findById(messageId);
  //     if (message) {
  //       message.status = "delivered";
  //       await message.save();
  //       console.log("Message status updated to delivered");
  //     }
  //   } catch (error) {
  //     console.error("Error updating message status:", error);
  //   }
  // });

  socket.on("add-friend", async ({ senderId, receiverEmail }, callback) => {
    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findOne({ email: receiverEmail });

      if (!sender || !receiver) {
        return callback({
          success: false,
          message: "Invalid sender or receiver ID.",
        });
      }

      if (receiver.friendRequests.includes(sender._id)) {
        return callback({
          success: false,
          message: "Already request sent.",
        });
      }

      if (receiver.friends.includes(sender._id)) {
        return callback({
          success: false,
          message: "Already friends.",
        });
      }

      receiver.friendRequests.push(sender._id);
      await receiver.save();

      const populatedReceiver = await User.findById(receiver._id).populate(
        "friends",
        "name email isVerified"
      );

      const receiverSocketId = users[receiver._id];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("trigger-requests", {
          data: populatedReceiver,
        });
      }

      callback({ success: true, message: "Friend request sent successfully." });
    } catch (error) {
      console.error("Error in add-friend:", error);
      callback({ success: false, message: "Failed to send friend request." });
    }
  });

  socket.on("accept-request", async ({ senderId, requestId }, callback) => {
    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(requestId);

      console.log("Add friend => ", senderId, requestId);

      if (!sender || !receiver) {
        return callback({
          success: false,
          message: "Invalid sender or receiver ID.",
        });
      }

      sender.friendRequests.pull(receiver._id);

      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);
      await sender.save();
      await receiver.save();

      const populatedSender = await User.findById(senderId).populate(
        "friends",
        "name email isVerified"
      );
      const populatedReceiver = await User.findById(receiver._id).populate(
        "friends",
        "name email isVerified"
      );

      const receiverSocketId = users[receiver._id];
      const senderSocketId = users[sender._id];

      if (receiverSocketId) {
        console.log("receiverSocketId => ", receiverSocketId, receiver);
        io.to(receiverSocketId).emit("trigger-requests", {
          data: populatedReceiver,
        });
      }

      if (senderSocketId) {
        console.log("senderSocketId => ", senderSocketId, sender);

        io.to(senderSocketId).emit("trigger-requests", {
          data: populatedSender,
        });
      }

      callback({ success: true, message: "Friend request sent successfully." });
    } catch (error) {
      console.error("Error in add-friend:", error);
      callback({ success: false, message: "Failed to send friend request." });
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete users[userId];
    }
    console.log("User disconnected", users);
  });

  console.log("Users : ", users);
});

app.use("/auth", auth);

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
