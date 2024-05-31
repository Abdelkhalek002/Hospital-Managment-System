const express = require("express");
const router = express.Router();

const {
  getStudentProfile,
  updateUserProfile,
  uploadUserImage,
  resizeImage,
  updateProfilePhoto,
} = require("../controllers/userProfileController");

const {
  updateUserProfileValidator,
} = require("../utiles/validators/userProfileValidator");

//protect method
const { Protect } = require("../middlewares/Auth/auth");

router
  .route("/:student_id")
  .get(Protect, getStudentProfile)
  .put(Protect, updateUserProfileValidator, updateUserProfile)
  .patch(Protect, uploadUserImage, resizeImage, updateProfilePhoto);

module.exports = router;
