import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { getAuth } from "@clerk/express";
import slugify from "slugify";
import ImageKit from "imagekit";

export const getPosts = async (req, res) => {
  console.log("hello");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const query = {};

  const category = req.query.category;
  const author = req.query.author;
  const searchQuery = req.query.search;
  const sortQuery = req.query.sort;
  const isFeatured = req.query.featured;

  const filter = req.query.difficulty;

  console.log(req.query);

  if (category && category !== "allRecipes") {
    query.category = category;
  }

  if (searchQuery) {
    query.title = { $regex: searchQuery, $options: "i" };
  }

  if (author) {
    const user = await User.findOne({ username: author }).select("_id");

    if (!user) return res.status(404).json("No Post found");

    query.user = user._id;
  }

  if (isFeatured === "true") {
    query.featured = true;
  }

  // Default sort value
  let sortOption = { createdAt: -1 };
  if (sortQuery) {
    switch (sortQuery) {
      case "most-popular":
        sortOption = { visit: -1 };
        break;
      case "name-asc":
        sortOption = { title: 1 };
        break;
      case "name-desc":
        sortOption = { title: -1 };
        break;
      case "time-asc":
        sortOption = { cookingTime: 1 };
        break;
      case "time-desc":
        sortOption = { cookingTime: -1 };
        break;
      case "date-newest":
        sortOption = { createdAt: -1 };
        break;
      case "date-oldest":
        sortOption = { createdAt: 1 };
        break;
      default:
        break;
    }
  }

  if (filter && filter !== "") {
    query.difficulty = filter;
  }

  // const posts = await Post.find();

  const posts = await Post.find(query)
    .populate("user", "username")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  const totalPosts = await Post.countDocuments();
  const hasMore = page * limit < totalPosts;

  res.status(200).json({ posts, hasMore });
};

// Get Single Post
export const getPost = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    "user",
    "username img"
  );
  res.status(200).json(post);
};

// Create New Post
export const createPost = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    console.log("ClerkUserId:", clerkUserId);

    // If not signed in, clerkUserId will not be found.
    if (!clerkUserId) return res.send("User Not Authenticated");

    // All User details was already saved in DB. So now fetching user details from DB using clerkUserId
    const user = await User.findOne({ clerkUserId });

    // console.log(user);

    // Slugify
    let slug = slugify(req.body.title, { lower: true, strict: true }); // hello-world
    let baseSlug = slug;
    let counter = 2;

    let existingPost = await Post.findOne({ slug });

    while (existingPost) {
      slug = `${baseSlug}-${counter}`;
      existingPost = await Post.findOne({ slug });
      counter++;
    }

    // Now creating new post with all the data in the req.body and also user Id
    const newPost = new Post({ user: user._id, slug, ...req.body });
    const post = await newPost.save();

    res.status(200).json(post);
  } catch (error) {
    // console.log("hello im catch");
    if (error.name === "ValidationError") {
      // Build an errors object with field: message
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ errors });
    }

    // handle other errors
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    console.log("Current User ClerkUserId:", clerkUserId);

    // 1. Check authentication to check if the user is same
    if (!clerkUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 3. Find post by ID
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const role = req.auth.sessionClaims?.metadata?.role || "user";

    if (role === "admin") {
      await Post.findByIdAndDelete(req.params.id);
      return res
        .status(200)
        .json({ message: "Post deleted successfully", post });
    }

    // 2. Find user
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Check if the post belongs to the current user
    if (!post.user.equals(user._id)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this post" });
    }

    // 5. Delete post
    await post.deleteOne();
    console.log(post);

    res.status(200).json({ message: "Post deleted successfully", post });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Uploading to Imagekit
const imagekit = new ImageKit({
  urlEndpoint: process.env.IK_URL_ENDPOINT,
  publicKey: process.env.IK_PUBLIC_KEY,
  privateKey: process.env.IK_PRIVATE_KEY,
});

// Imagekit Auth for Uploading file to Clerk Media Library
export const uploadAuth = async (req, res) => {
  const { token, expire, signature } = imagekit.getAuthenticationParameters();
  res.send({
    token,
    expire,
    signature,
    publicKey: process.env.IK_PUBLIC_KEY,
  });
};

// Get Posts By user

export const getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const excludeId = req.params.excludeId;

    const posts = await Post.find({
      user: userId,
      _id: { $ne: excludeId },
    })
      .limit(4)
      .populate("user", "username");

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related posts" });
  }
};

// Fetching Featured Posts
export const featurePost = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    console.log("Current User ClerkUserId:", clerkUserId);
    const postId = req.body.postId;

    // 1. Check authentication to check if the user is same
    if (!clerkUserId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const role = req.auth.sessionClaims?.metadata?.role || "user";

    if (role === "admin") {
      await Post.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Post deleted successfully" });
    }

    const post = await Post.findById(postId);

    if (!post) return res.json("Post Not Found");

    const isFeatured = post.isFeatured;

    const updatedPost = await Post.findByIdAndUpdate(postId, {
      isFeatured: !isFeatured,
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
