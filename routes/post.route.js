const express = require("express");
const router = express.Router();

const postController = require("../controllers/post.controller");
const upload = require("../middleware/upload.middleware");
const { authentication, adminAuthorized } = require("../middleware/auth.middleware");

router.get("/allPosts", authentication, adminAuthorized, postController.getAllPosts);

router
  .route("/")
  .post(authentication, upload.single("image"), postController.createPost)
  .get(authentication, postController.getPosts)
  .patch(authentication, upload.single("image"), postController.updatePost);

router.delete("/:id", authentication, postController.deletePost);

module.exports = router;