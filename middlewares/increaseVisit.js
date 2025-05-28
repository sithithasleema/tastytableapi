import Post from "../models/post.model.js";

const increateVisit = async (req, res, next) => {
  const slug = req.params.slug;
  const post = await Post.findOneAndUpdate(
    { slug },
    { $inc: { visit: 1 } },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  next();
};

export default increateVisit;
