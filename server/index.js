import http from "http";
import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Chat from "./models/ChatModel.js";
import auth from "./routes/auth.js";
import "dotenv/config";
import cors from "cors";
import User from "./models/user.js";

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

  socket.on(
    "message-send",
    async ({ senderId, receiverId, message, status }) => {
      await Chat.create({ senderId, receiverId, message, status });
      socket.to(receiverId).emit("message-receive", { senderId, message });
    }
  );

  socket.on("add-friend", async ({ senderId, receiverEmail }, callback) => {
    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findOne({ email: receiverEmail });

      console.log("Add friend => ", senderId, receiverEmail);

      if (!sender || !receiver) {
        return callback({
          success: false,
          message: "Invalid sender or receiver ID.",
        });
      }

      receiver.friendRequests.push(sender._id);
      await receiver.save();
      const receiverSocketId = users[receiver._id];
      console.log(
        "receiver.socketId => ",
        receiver.socketId,
        "\nreceiverSocketId => ",
        receiverSocketId
      );
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("trigger-requests", { receiver });
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
      const receiverSocketId = users[receiver._id];
      const senderSocketId = users[sender._id];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("trigger-requests", { receiver });
      }

      if (senderSocketId) {
        io.to(senderSocketId).emit("trigger-requests", { receiver: sender });
      }

      callback({ success: true, message: "Friend request sent successfully." });
    } catch (error) {
      console.error("Error in add-friend:", error);
      callback({ success: false, message: "Failed to send friend request." });
    }
  });

  socket.on("disconnect", () => {
    if (userId) delete userId[userId];
    console.log("User disconnected");
  });

  console.log("Users : ", users);
});

app.use("/auth", auth);

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
