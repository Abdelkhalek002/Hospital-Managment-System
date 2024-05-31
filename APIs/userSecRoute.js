const express = require("express");

const { changeUserPassword } = require("../controllers/userSecController");
const { Protect } = require("../middlewares/Auth/auth.js");
const limiter = require("../services/limitReqsMiddleware.js");

const router = express.Router();

router.route("/change/:student_id").post(Protect, limiter, changeUserPassword);

module.exports = router;
