const express = require("express");

const {
  addNewAdmin,
  getAllAdmin,
  viewAdmin,
  updateAdmin,
  deleteAdmin,
  sendObservation,
  acceptOrDecline,
  resetPassword,
  getAdminLogs,
  getSpecificAdminLogs,
  clearHistory,
  clearSpecificHistory,
  getAllProfiles,
  searchStudent,
  advancedSearch,
  filterStudents,
  transfer,
  addSuperAdmin,
  getAllUserProfiles,
  updateUserProfile,
  deleteUserProfile,
} = require("../controllers/adminController.js");

const {
  addNewAdminValidator,
  resetPasswordValidator,
  sendObservationValidator,
  addSuperAdminValidator,
} = require("../utiles/validators/adminValidator");
const { Protect, allowedTo } = require("../middlewares/Auth/auth.js");
const limiter = require("../services/limitReqsMiddleware.js");
const { Roles } = require("../utiles/Roles.js");

const router = express.Router();

//ADMIN LOG ROUTERS:
//1) get admin logs
router
  .route("/logs")
  .get(Protect, allowedTo(Roles.SUPER_ADMIN), getAdminLogs)
  .delete(Protect, clearHistory);

//2) modify specific admin logs
router
  .route("/logs/:admin_id")
  .get(Protect, allowedTo(Roles.SUPER_ADMIN), getSpecificAdminLogs)
  .delete(Protect, allowedTo(Roles.SUPER_ADMIN), clearSpecificHistory);




//1) get all user profiles:
router
  .route("/userProfiles")
  .get(
    Protect,
    allowedTo(
      Roles.COUNTER,
      Roles.MEDICAL_CHECK_MANAGER,
      Roles.OBSERVER,
      Roles.SECOND_MANAGER,
      Roles.SUPER_ADMIN
    ),
    getAllUserProfiles
  );

router.route("/userProfiles/:student_id").put(updateUserProfile).delete(deleteUserProfile);

//ADMIN CRUD ROUTERS:
//1) add new admin:
router
  .route("/")
  .post(
    limiter,
    addNewAdminValidator,
    addNewAdmin
  );
router
  .route("/add")
  .post(
    limiter,
    addSuperAdminValidator,
    addSuperAdmin
  );
//2) get all admins:
router.route("/all").get(getAllAdmin);

//3) view, update, delete, and reset password for admin:
//4) filter students:
router.get(
  "/filter",
  Protect,
  allowedTo(
    Roles.COUNTER,
    Roles.MEDICAL_CHECK_MANAGER,
    Roles.OBSERVER,
    Roles.SECOND_MANAGER,
    Roles.SUPER_ADMIN
  ),
  filterStudents
);


router
  .route("/:user_id")
  .get(viewAdmin)
  .put(limiter, updateAdmin)
  .patch(
    limiter,
    Protect,
    allowedTo(Roles.SUPER_ADMIN),
    resetPasswordValidator,
    resetPassword
  )
  .delete(deleteAdmin);

//SYSTEM FEATURES ROUTERS


//2) search for specific student:
router
  .route("/search")
  .post(
    Protect,
    allowedTo(
      Roles.COUNTER,
      Roles.MEDICAL_CHECK_MANAGER,
      Roles.OBSERVER,
      Roles.SECOND_MANAGER,
      Roles.SUPER_ADMIN
    ),
    searchStudent
  );

//3) Advanced search:
router
  .route("/advancedSearch")
  .post(
    Protect,
    allowedTo(
      Roles.COUNTER,
      Roles.MEDICAL_CHECK_MANAGER,
      Roles.OBSERVER,
      Roles.SECOND_MANAGER,
      Roles.SUPER_ADMIN
    ),
    advancedSearch
  );



//ADMIN MAIN ROUTERS
//1) accept or reject student requests:
router
  .route("/acceptOrDecline/:id")
  .patch(Protect, allowedTo(Roles.SUPER_ADMIN, Roles.COUNTER), acceptOrDecline);

//2) transfer to another hospital:
router
  .route("/transfer")
  .post(Protect, allowedTo(Roles.SUPER_ADMIN, Roles.TRANSFER_CLERK), transfer);

//3) auditing user data:
router
  .route("/:student_id")
  .post(
    Protect,
    allowedTo(Roles.SUPER_ADMIN, Roles.COUNTER, Roles.OBSERVER),
    sendObservationValidator,
    sendObservation
  );

module.exports = router;
