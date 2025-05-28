import Review from "../models/review.model.js";
import User from "../models/user.model.js";

export const getPostReview = async (req, res) => {
  console.log("Hellow get all reviews");
  const postId = req.params.postId;

  const reviews = await Review.find({ post: postId })
    .populate("user", "username img")
    .sort({ createdAt: -1 });

  if (!reviews) return console.log("Not Reviews Yet");
  res.json(reviews);
};

export const addReview = async (req, res) => {
  const clerkUserId = req.auth.userId;
  const postId = req.params.postId;
  console.log(clerkUserId);

  if (!clerkUserId) return res.json("Not Authenticated");

  const user = await User.findOne({ clerkUserId });

  console.log(user);

  const newReview = new Review({ ...req.body, user: user._id, post: postId });
  const savedReview = await newReview.save();
  //   console.log(savedComment);
  return res.status(201).json(savedReview);
};

export const deleteReview = async (req, res) => {
  const clerkUserId = req.auth.userId;
  const id = req.params.id;

  if (!clerkUserId) return res.json("Not Authenticated");

  const role = req.auth.sessionClaims?.metadata?.role || "user";

  if (role === "admin") {
    await Review.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Review deleted successfully" });
  }

  const user = await User.findOne({ clerkUserId });

  console.log(user);

  const deletedReview = Review.findOneAndDelete({ _id: id, user: user._id });
  const savedComment = await newComment.save();
  //   console.log(savedComment);

  if (!deletedReview) return res.json("You can delete only Your comment");

  res.status(200).json("Comment Deleted");
};
