const express = require("express");

const {
  createFaculty,
  getAllFaculties,
  deleteFaculty,
  updateFaculty,
} = require("../../controllers/systemDataControllers/facultyController");

//validation
const {
  facultyValidator,
} = require("../../utiles/validators/sysDataValidator");
const limiter = require("../../services/limitReqsMiddleware.js");

const { Protect, allowedTo } = require("../../middlewares/Auth/auth.js");
const { Roles } = require("../../utiles/Roles.js");

const router = express.Router();

router
  .route("/faculties")
  .post(
    Protect,
    allowedTo(Roles.SUPER_ADMIN),
    limiter,
    facultyValidator,
    createFaculty
  )
  .get(getAllFaculties);

router
  .route("/faculties/:faculty_id")
  .delete(Protect,  allowedTo(Roles.SUPER_ADMIN),limiter, deleteFaculty)
  .put(
    Protect,
    allowedTo(Roles.SUPER_ADMIN),
    limiter,
    facultyValidator,
    updateFaculty
  );

module.exports = router;
