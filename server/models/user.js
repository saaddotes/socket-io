import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    socketId: { type: String },
    isVerified: { type: Boolean, require: true, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
