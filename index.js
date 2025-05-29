import dotenv from "dotenv";
dotenv.config();

console.log(
  "🔑 IK_PUBLIC_KEY in post.controller.js:",
  process.env.IK_PUBLIC_KEY
);

import express from "express";
import connectDB from "./lib/connectDB.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import reviewRouter from "./routes/review.route.js";
import webhooksRouter from "./routes/webhook.route.js";
import { clerkMiddleware } from "@clerk/express";
import { clerkClient, requireAuth, getAuth } from "@clerk/express";
import cors from "cors";
// import ImageKit from "imagekit";

const app = express();
const port = 3000;

console.log("✅ .env Loaded");
console.log("IK_PUBLIC_KEY:", process.env.IK_PUBLIC_KEY);
app.use(clerkMiddleware());
app.use(cors());

app.use(cors(process.env.CLIENT_URL));

app.use("/webhooks", webhooksRouter);

// Setup JSON parser for regular routes first
app.use(express.json());

// Error Handling...
app.use((error, req, res, next) => {
  res.status(error.status || 500);

  res.json({
    message: error.message || "Something went wrong",
    status: error.status,
    stack: error.stack,
  });
});

// allow cross-origin requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  console.log(process.env.IK_PUBLIC_KEY);
  res.send("Hello World!");
});

// app.get("/protected", (req, res) => {
//   const { userId, sessionId } = req.auth;
//   console.log(userId, sessionId, req.auth);
//   res.send("Authenticated");

//   if (!userId) {
//     res.send("Not Authenticated");
//   }
// });

app.get("/protected", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const user = await clerkClient.users.getUser(userId);
  return res.json({ user });
});

app.use("/user", userRouter);
app.use("/posts", postRouter);
app.use("/reviews", reviewRouter);

app.listen(port, () => {
  // Connect to MongoDb
  connectDB();
  console.log(`Tasty Table listening on port ${port}`);
});
