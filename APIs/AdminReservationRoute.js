const express = require("express");

const {
  adminCreateRequest,
  adminUpdateRequest,
  adminViewRequest,
  adminDeleteRequest,
  adminGetAllReservations,
} = require("../controllers/AdminReservationController");
const { Protect, allowedTo } = require("../middlewares/Auth/auth.js");
const { Roles } = require("../utiles/Roles.js");
const { rollback } = require("../config/db.js");

const router = express.Router();

router
  .route("/")
  .post(Protect, allowedTo(Roles.COUNTER), adminCreateRequest)
  .get(Protect, allowedTo(Roles.COUNTER), adminGetAllReservations);

router
  .route("/:emergencyUser_id")
  .put(Protect, allowedTo(Roles.COUNTER), adminUpdateRequest)
  .get(Protect, allowedTo(Roles.COUNTER), adminViewRequest)
  .delete(Protect, allowedTo(Roles.COUNTER), adminDeleteRequest);

module.exports = router;
