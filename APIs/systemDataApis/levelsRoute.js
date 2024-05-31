const express = require("express");

const {
  createLevel,
  GetAllLevels,
  updateLevel,
  DeleteLevel,
} = require("../../controllers/systemDataControllers/levelsController");

const limiter = require("../../services/limitReqsMiddleware.js");

const { Protect, allowedTo } = require("../../middlewares/Auth/auth.js");

//validation
const { levelsValidator } = require("../../utiles/validators/sysDataValidator");
const { allow } = require("joi");
const { Roles } = require("../../utiles/Roles.js");

const router = express.Router();

router
  .route("/levels")
  .post(
    Protect,
    allowedTo(Roles.SUPER_ADMIN),
    levelsValidator,
    limiter,
    createLevel
  )
  .get(Protect, GetAllLevels);

router
  .route("/levels/:level_id")
  .delete(Protect,
    allowedTo(Roles.SUPER_ADMIN), limiter, DeleteLevel)
  .put(
    Protect,
    allowedTo(Roles.SUPER_ADMIN),
    limiter,
    levelsValidator,
    updateLevel
  );

module.exports = router;
