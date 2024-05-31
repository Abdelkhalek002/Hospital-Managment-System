//IOMPORTING DEPENDENCIES
const express = require("express");
const db = require("../../config/db");
const ApiError = require("../apiError");
const asyncHandler = require("express-async-handler");
// to check if the code is in arabic or not
exports.isArabic = (value) => {
  if (!/^[؀-ۿـ\s]+$/u.test(value)) {
    throw new Error(`( ${value} ) format is not in arabic!`);
  }
  return true;
};

//to validate appointment date
exports.isValidDate = (value) => {
  // Parse the input value as a date
  const appointmentDate = new Date(value);

  // Check if the date is valid
  if (Number.isNaN(appointmentDate)) {
    throw new Error("invalid date information");
  }

  // Get the current date
  const currentDate = new Date();

  // Check if the appointment date is in the future
  if (appointmentDate <= currentDate) {
    throw new Error("invalid date information");
  }
  return true;
};

exports.isverified = (email) => {
  const sql = "SELECT verified FROM students WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (result.verified == 0) {
      throw new Error(
        "account is not activated, please activate your account!",
        400
      );
    }
    return true;
  });
};

//to validate helwan univercity account
exports.isUniEmail = (value) => {
  const domain = value.split("@")[1];
  if (!domain.endsWith(".helwan.edu.eg")) {
    throw new Error("invalid helwan univercity account");
  }
  return true;
};
