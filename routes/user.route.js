import express from "express";
import { bookmarkPost, getsavedPosts } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/savedPosts", getsavedPosts);
router.patch("/bookmarkPost", bookmarkPost);

export default router;
