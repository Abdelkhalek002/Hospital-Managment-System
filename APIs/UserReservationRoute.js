const express = require("express");

const {
  createRequest,
  updateRequest,
  viewRequest,
  getMyReservations,
  cancelRequest,
} = require("../controllers/UserReservationController");

//IMPORT VALIDATORS
const {
  createRequestValidator,
  updateRequestValidator,
} = require("../utiles/validators/ReservationValidator");
const { Protect, allowedToUser } = require("../middlewares/Auth/auth.js");

const router = express.Router();

router
  .route("/:student_id")
  .post(Protect, allowedToUser("user"), createRequestValidator, createRequest);

router
  .route("/:student_id")
  .get(Protect, allowedToUser("user"), getMyReservations);

router.route("/:student_id/:medicEx_id").put(Protect, allowedToUser("user"), updateRequest);

router
  .route("/:student_id/:medicEx_id")
  .get(Protect, allowedToUser("user"), viewRequest);

router
.route("/:student_id/:medicEx_id")
.delete(Protect, allowedToUser("user"),cancelRequest);

module.exports = router;
