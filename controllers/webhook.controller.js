import User from "../models/user.model.js";
import { Webhook } from "svix";

export const clerkWebhook = async (req, res) => {
  console.log("webhook controller hitted");
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Webhook Secret Needed");
  }

  const payload = req.body.toString(); // important for signature verification
  const headers = req.headers;

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(400).json({
      message: "Webhook Verification failed",
    });
  }

  //   console.log("Event Type:", evt.type);
  //   console.log("Event Data:", evt.data);

  // User Created
  if (evt.type === "user.created") {
    try {
      const newUser = new User({
        clerkUserId: evt.data.id,
        username:
          evt.data.username || evt.data.email_addresses?.[0]?.email_address,
        email: evt.data.email_addresses?.[0]?.email_address,
        img: evt.data.profile_image_url,
      });

      await newUser.save();
      console.log("New user saved to DB:", newUser);
    } catch (err) {
      console.error("Failed to save user:", err);
    }
  }

  // User Deleted

  if (evt.type === "user.deleted") {
    try {
      const deletedUser = await User.findOneAndDelete({
        clerkUserId: evt.data.id,
      });
      if (deletedUser) {
        console.log("User Deleted", deletedUser);
      } else {
        console.log("Couldnot find user");
      }
    } catch (err) {
      console.error("Failed to save user:", err);
    }
  }

  // User Updated
  if (evt.type === "user.updated") {
    try {
      const updatedUser = await User.findOneAndUpdate(
        { clerkUserId: evt.data.id },
        {
          username:
            evt.data.username || evt.data.email_addresses?.[0]?.email_address,
          email: evt.data.email_addresses?.[0]?.email_address,
          img: evt.data.profile_image_url,
        },
        { new: true }
      );

      if (updatedUser) {
        console.log("User updated in DB:", updatedUser);
      } else {
        console.log("User to update not found:", evt.data.id);
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  }

  res.status(200).json({ success: true });
};
