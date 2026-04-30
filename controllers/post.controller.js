const Post = require("../models/post.model");
const path = require("path");
const fs = require("fs");

const postController = {
  createPost: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "image is required" });
      }

      const date = new Date().toISOString();
      const post = new Post({
        ...req.body,
        owner: req.user._id,
        date: date,
        image: `uploads/${req.file.filename}`,
      });

      await post.save();
      return res.status(201).send({
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getPosts: async (req, res) => {
    try {
      const posts = await Post.find({ owner: req.user._id });
      return res.status(200).send(posts);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const post = await Post.findOne({
        _id: req.body.id,
        owner: req.user._id,
      });

      if (!post) {
        return res.status(404).send({ message: "Post not found" });
      }

      if (req.file) {
        if (post.image) {
          const oldImagePath = path.join(__dirname, "../", post.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        post.image = `uploads/${req.file.filename}`;
      }

      const { owner, image, ...allowedBody } = req.body;
      Object.assign(post, allowedBody);

      await post.save();
      return res.status(200).send(post);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Post.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!post) {
        return res.status(404).send({ message: "Post not found" });
      }

      if (post.image) {
        const imagePath = path.join(__dirname, "../", post.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      return res.status(200).send({ message: "Post deleted successfully" });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const allPosts = await Post.find().populate("owner", "firstName lastName email");
      return res.status(200).send(allPosts);
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};

module.exports = postController;