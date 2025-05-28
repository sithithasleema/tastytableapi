import User from "../models/user.model.js";

// Fetching all Saved Posts
export const getsavedPosts = async (req, res) => {
  const clerkUserId = await req.auth.userId;

  if (!clerkUserId) return res.status(401).json("Not Authenticated");

  const user = await User.findOne({ clerkUserId });
  return res.status(200).json(user?.savedPosts || []);
};

export const bookmarkPost = async (req, res) => {
  console.log("Hello from backend bookmark controller");
  const clerkUserId = await req.auth.userId;
  const postId = req.body.postId;

  if (!clerkUserId) return res.status(401).json("Not Authenticated");

  const user = await User.findOne({ clerkUserId });
  console.log(user);

  const isSaved = user?.savedPosts.some((p) => p.toString() === postId);
  console.log(isSaved);

  if (!isSaved) {
    await User.findByIdAndUpdate(user?._id, { $push: { savedPosts: postId } });
  } else {
    await User.findByIdAndUpdate(user?._id, { $pull: { savedPosts: postId } });
  }
  return res.status(200).json({
    message: isSaved ? "Removed from Bookmark" : "Added to Bookmark",
  });
};
