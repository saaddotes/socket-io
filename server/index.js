import http from "http";
import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Chat from "./models/ChatModel.js";
import auth from "./routes/auth.js";
import "dotenv/config";
import cors from "cors";

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
