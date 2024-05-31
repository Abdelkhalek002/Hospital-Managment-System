//IMPORTING DEPENDENCIES
const { check } = require("express-validator");
const validatorMiddleware = require("../../middleWares/validatorMiddleware");
const customValidators = require("../customValidators/CustomValidators");

addNewAdminValidator = [
  check("userName").notEmpty().withMessage("userName is required"),
  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email is not valid"),
  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
  check("role").notEmpty().withMessage("role is required"),
  validatorMiddleware,
];


addSuperAdminValidator = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email is not valid"),
  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
  check("role").notEmpty().withMessage("role is required"),
  validatorMiddleware,
];


updateAdminValidator = [
  check("userName").notEmpty().withMessage("userName is required"),
  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email is not valid"),
  check("role").notEmpty().withMessage("role is required"),
  validatorMiddleware,
];

resetPasswordValidator = [
  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
  validatorMiddleware,
];

sendObservationValidator = [
  check("observation")
    .notEmpty()
    .withMessage("Observation is required")
    .isLength({ min: 4 })
    .withMessage("observation must be at least 6 characters long"),
  validatorMiddleware,
];



module.exports = {
  addNewAdminValidator,
  addSuperAdminValidator,
  updateAdminValidator,
  resetPasswordValidator,
  sendObservationValidator,
};
