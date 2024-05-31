const express = require("express");

const {
  createClinic,
  getAllClinics,
  deleteClinic,
  updateClinic,
} = require("../../controllers/systemDataControllers/clinicsController");

const limiter = require("../../services/limitReqsMiddleware.js");

const { Protect, allowedTo } = require("../../middlewares/Auth/auth.js");

//validation
const { clinicValidator } = require("../../utiles/validators/sysDataValidator");
const { Roles } = require("../../utiles/Roles.js");

const router = express.Router();

router
  .route("/clinics")
  .post(
    limiter,
    clinicValidator,
    createClinic
  )
  .get(Protect, getAllClinics);

router
  .route("/clinics/:clinic_id")
  .delete(limiter, deleteClinic)
  .put(
    limiter,
    clinicValidator,
    updateClinic
  );

module.exports = router;
