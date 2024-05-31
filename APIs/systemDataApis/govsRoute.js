const express = require("express");

const {
  createGovernorate,
  deleteGovernorate,
  updateGovernorate,
  GetAllGovernorates,
} = require("../../controllers/systemDataControllers/govsController");
const limiter = require("../../services/limitReqsMiddleware.js");
const { Protect } = require("../../middlewares/Auth/auth.js");
const { Roles } = require("../../utiles/Roles.js");

const router = express.Router();

router
  .route("/governorates")
  .get(GetAllGovernorates)
  .post(Protect, allowedTo(Roles.SUPER_ADMIN), limiter, createGovernorate);
router
  .route("/governorates/:gov_id")
  .put(Protect, allowedTo(Roles.SUPER_ADMIN), limiter, updateGovernorate)
  .delete(Protect, allowedTo(Roles.SUPER_ADMIN), limiter, deleteGovernorate);

module.exports = router;
