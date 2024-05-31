//IMPORTING DEPENDENCIES
const { check } = require("express-validator");
const validatorMiddleware = require("../../middleWares/validatorMiddleware");
const customValidators = require("../customValidators/CustomValidators");

////@desc   limit reservations to 50 requests per day
exports.isLimitReached = (err, result) => {
  if (err) {
    console.error(`Error checking reservation limit:`, err);
  } else if (result.length >= 20) {
    return true;
  }
  return false;
};

exports.createRequestValidator = [
  check("clinic_id").notEmpty().isNumeric(),
  check("date")
    .notEmpty()
    .withMessage("request date is required")
    .custom(customValidators.isValidDate),
  validatorMiddleware,
];
exports.updateRequestValidator = [
  check("clinic_id").notEmpty().isNumeric(),
  check("date")
    .notEmpty()
    .withMessage("date for new reservation is required")
    .custom(customValidators.isValidDate),
  check("examType")
    .custom(customValidators.isArabic)
    .isIn(["كشف جديد", "متابعة"])
    .withMessage("error happened in taking exam type data")
    .optional(),
  validatorMiddleware,
];
exports.deleteRequestValidator = [
  check("id").isInt().withMessage("invalid student id !"),
  validatorMiddleware,
];
