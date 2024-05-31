const express = require("express");

const {
  uploadRegisterationFiles,
  resizeFiles,
  signup,
  login,
  forgetPassword,
} = require("../controllers/authController");

const { Protect } = require("../middlewares/Auth/auth.js");

//IMPORT MIDDLEWARES
const { activateEmail } = require("../services/avtivateUserMiddleware.js");

//IMPORT VALIDATORS
const {
  signupValidator,
  sendOtpValidator,
  forgetPasswordValidator,
} = require("../utiles/validators/authValidator");
const { sendOtp } = require("../services/sendOTP_Middleware.js");
const limiter = require("../services/limitReqsMiddleware.js");
const { confirmEmail } = require("../services/confirmSuperAdmin.js");

const router = express.Router();

//router.route("/login").post(loginValidator, login);

router
  .route("/signUp")
  .post(uploadRegisterationFiles, resizeFiles, signupValidator, signup);
router.get("/activate", activateEmail);

router
  .post("/sendOtp", sendOtpValidator, limiter, sendOtp)
  .post("/forgetPassword", forgetPasswordValidator, forgetPassword)
  .post("/login", login);
router.get("/confirmEmail", confirmEmail);

module.exports = router;
