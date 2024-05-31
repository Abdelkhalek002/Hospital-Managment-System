//IMPORTING DEPENDENCIES
const { check } = require("express-validator");
const validatorMiddleware = require("../../middleWares/validatorMiddleware");
const customValidators = require("../customValidators/CustomValidators");

//CLINICS VALIDATOR
exports.clinicValidator = [
  check("clinicName")
    .notEmpty()
    .withMessage("Clinic is Required")
    .custom(customValidators.isArabic)
    .withMessage("Clinic must be in arabic format"),
  validatorMiddleware,
];
//EXTERNAL HOSPITALS VALIDATOR
exports.hospitalValidator = [
  check("hospName")
    .notEmpty()
    .withMessage("Hospital is Required")
    .custom(customValidators.isArabic)
    .withMessage("Hospital must be in arabic format"),
  validatorMiddleware,
];
//FACULTY VALIDATOR
exports.facultyValidator = [
  check("facultyName")
    .notEmpty()
    .withMessage("The Name of Faculty is Required")
    .custom(customValidators.isArabic)
    .withMessage("The Name of Faculty must be in arabic format"),
  validatorMiddleware,
];
//NATIONALITY VALIDATOR

//LEVELS VALIDATOR
exports.levelsValidator = [
  check("levelName")
    .notEmpty()
    .withMessage("level is required")
    .custom(customValidators.isArabic)
    .withMessage("level must be in arabic format"),
  validatorMiddleware,
];
