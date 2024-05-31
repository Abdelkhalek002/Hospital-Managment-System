const express = require("express");

const {
  createHospital,
  getAllhospitals,
  deleteHospital,
  updateHospital,
} = require("../../controllers/systemDataControllers/hospController");

//validation
const {
  hospitalValidator,
} = require("../../utiles/validators/sysDataValidator");
const limiter = require("../../services/limitReqsMiddleware.js");

const { Protect, allowedTo } = require("../../middlewares/Auth/auth.js");

const router = express.Router();

router
  .route("/hospitals")
  .post(
    limiter,
    hospitalValidator,
    createHospital
  )
  .get(getAllhospitals);
router
  .route("/hospitals/:exHosp_id")
  .delete( deleteHospital)
  .put(
    limiter,
    hospitalValidator,
    updateHospital
  );
module.exports = router;
