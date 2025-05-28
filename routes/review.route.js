import express from "express";
import {
  addReview,
  deleteReview,
  getPostReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.get("/:postId", getPostReview);
router.post("/:postId", addReview);

router.delete("/:id", deleteReview);

export default router;
