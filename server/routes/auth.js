import { Router } from "express";
import checkCredentials from "../middleware/authValidation.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import "dotenv/config.js";

const { JWT_SECRET, USERNAME, PASSWORD } = process.env;

const app = Router();

app.post("/signup", checkCredentials, async (req, res) => {
  const { name, email, password } = req.body;
  const encryptedPass = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({
      name,
      email,
      password: encryptedPass,
      friendRequests: [],
      friends: [],
    });
    const safeData = newUser.toObject();
    delete safeData.password;
    const token = jwt.sign(safeData, JWT_SECRET);

    res.status(200).json({
      success: true,
      message: "Created User Succesfully",
      data: safeData,
      token,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Server Error While adding user : " + e.message,
    });
  }
});

app.post("/login", checkCredentials, async (req, res) => {
  const { email, password } = req.body;

  console.log("Logging");

  try {
    const user = await User.findOne({ email })
      .select("+password")
      .populate("friends", "name email isVerified")
      .lean();
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "No User Exists" });
    }

    const checkPass = await bcrypt.compare(password, user.password);

    if (!checkPass) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Password" });
    }

    // const safeUser = user.toObject();
    // delete safeUser.password;
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

    console.log("logged User", user);
    res
      .status(200)
      .json({ success: true, message: "User Founded", data: user, token });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Server Error While adding user" + e.message,
    });
  }
});

app.post("/sendemail", (req, res) => {
  const { token, listOfEmails } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: USERNAME,
      pass: PASSWORD,
    },
  });

  const mailOptions = {
    from: "cadetsaadsoomro@gmail.com",
    to: listOfEmails,
    subject: "Email Verification",
    html: "http://192.168.0.108:4000/auth/verifyemail" + token,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return res.json({ error: err });
    }
    res.json({ info });
  });

  res.status(200).json({ success: true, message: "Email send successfully" });
});

app.get("/verifyemail/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token Required. :(" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(400).json({ success: false, message: "Invalid Token" });

    return res
      .status(200)
      .json({ success: true, message: "Verifed Email Successfully.", user });
  });
});

app.post("/verifyToken", async (req, res) => {
  const { token, email } = req.body;
  // console.log("email ", email, "\ntoken ", token);

  const decoded = jwt.verify(token, JWT_SECRET);

  const user = await User.findOne({ email });
  console.log("user", user);
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Token is not valid or expired" });
  }

  res
    .status(200)
    .json({ success: true, message: "Token is valid", data: user });
});

// app.post("/joinMember", async (req, res) => {
//   const { senderEmail, receiverEmail } = req.body;
//   if (!senderEmail || !receiverEmail)
//     return res.status(400).json({
//       message: "Both Sender's and Receiver's emails required !",
//       success: false,
//     });

//   try {
//     const sender = await User.findOne({ email: senderEmail }).lean();
//     const receiver = await User.findOne({ email: receiverEmail }).lean();

//     if (!sender)
//       return res
//         .status(400)
//         .json({ message: "Sender doest find  !", success: false });

//     if (!receiver)
//       return res
//         .status(400)
//         .json({ message: "User not found !", success: false });

//     let chatRoom = await ChatRoom.findOne({
//       members: { $all: [sender._id, receiver._id] },
//     });

//     if (!chatRoom) {
//       chatRoom = new ChatRoom({ members: [sender._id, receiver._id] });
//       await chatRoom.save();
//     }

//     res.status(200).json({
//       message: "Chat Room Ready",
//       success: true,
//       chatRoomId: chatRoom._id,
//       receiver: {
//         _id: receiver._id,
//         email: receiver.email,
//         name: receiver.name,
//       },
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Internal Server Error", success: false });
//   }
// });

// app.post("/friends", async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found!" });
//     }

//     const chatRooms = await ChatRoom.find({ members: user._id }).populate({
//       path: "members",
//       select: "name email",
//     });

//     const friends = chatRooms.flatMap((room) =>
//       room.members.filter(
//         (member) => member._id.toString() !== user._id.toString()
//       )
//     );

//     res.status(200).json({
//       success: true,
//       message: "Friends list fetched successfully!",
//       friends,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error: " + error.message,
//     });
//   }
// });

// app.post("/add-friend", async (req, res) => {
//   const { senderId, receiverEmail } = req.body;

//   try {
//     const sender = await User.findById(senderId);
//     const receiver = await User.findOne({ email: receiverEmail });

//     if (!sender || !receiver) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     if (receiver.friendRequests.includes(sender._id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Friend request already sent.",
//       });
//     }

//     if (receiver.friends.includes(sender._id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Already friends.",
//       });
//     }

//     receiver.friendRequests.push(sender._id);
//     await receiver.save();

//     res.status(200).json({
//       success: true,
//       message: "Friend request sent successfully.",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error: " + error.message,
//     });
//   }
// });

// app.post("/auth/accept-friend", async (req, res) => {
//   const { senderEmail, receiverEmail } = req.body;

//   try {
//     const sender = await User.findOne({ email: senderEmail });
//     const receiver = await User.findOne({ email: receiverEmail });

//     if (!sender || !receiver) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found." });
//     }

//     // Add sender to receiver's friend list and vice versa
//     receiver.friends.push(sender._id);
//     sender.friends.push(receiver._id);

//     // Remove sender from receiver's friend requests list
//     receiver.friendRequests = receiver.friendRequests.filter(
//       (id) => id.toString() !== sender._id.toString()
//     );

//     await receiver.save();
//     await sender.save();

//     res
//       .status(200)
//       .json({ success: true, message: "Friend request accepted!" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error accepting friend request: " + error.message,
//     });
//   }
// });

export default app;
