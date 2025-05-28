import express from "express";
import {
  getPosts,
  getPost,
  createPost,
  deletePost,
  uploadAuth,
  getPostsByUser,
  featurePost,
} from "../controllers/post.controller.js";
import increateVisit from "../middlewares/increaseVisit.js";
// import { requireAuth } from "@clerk/express";

const router = express.Router();

router.get("/upload-auth", uploadAuth);
router.get("/", getPosts);
router.get("/:slug", increateVisit, getPost);
router.post("/", createPost);
router.delete("/:id", deletePost);
// Route to get same User's posts
router.get("/user/:userId/:excludeId", getPostsByUser);

router.patch("/feature", featurePost);

export default router;
