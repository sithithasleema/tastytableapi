import { Schema } from "mongoose";
import mongoose from "mongoose";

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    img: {
      type: String,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        "vegetarian",
        "vegan",
        "meatAndPoultry",
        "seafood",
        "bakingAndDesserts",
        "highProtein",
        "lowCarb",
      ],

      required: [true, "Please choose Category"],
    },
    ingredients: {
      type: [String],
      required: [true, "Please enter atleast one ingredients"],
    },
    cookingTime: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },

    images: {
      type: [String],

      default:
        "https://ik.imagekit.io/sthasleema/placeholder.webp?updatedAt=1748409400175",
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one image is required.",
      },
    },
    procedure: {
      type: String,
      required: true,
    },
    visit: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
