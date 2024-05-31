//IMPORTING DEPENDENCIES
const asyncHandler = require("express-async-handler");
const ApiError = require("../utiles/apiError");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { log } = require("util");
const { StatusCode } = require("../utiles/statusCode");

//@desc     change user password
//@route    POST  /api/v1/password/change/:id
//@access   public
// exports.changeUserPassword = asyncHandler(async (req, res, next) => {
//   const { currentPassword, newPassword } = req.body;
//   const { student_id } = req.params;
//   // Select user from the database
//   const sql = "SELECT * FROM students WHERE student_id = ?";
//   db.query(sql, [student_id], async (err, result) => {
//     if (err) {
//       // Handle database error
//       return res.status(500).json({ message: "Database error" });
//     }
//     // Check if user exists
//     if (result.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const user = result[0];
//     const currentPasswordMatch = await bcrypt.compare(
//       currentPassword,
//       user.password
//     );
//     console.log(currentPasswordMatch);

//     console.log(user);
//     // Check if current password matches
//     if (currentPasswordMatch) {
//       const newPasswordHash = bcrypt.hashSync(newPassword, 8);
//       console.log(newPasswordHash);

//       // Update user's password
//       db.query(
//         "UPDATE students SET password = ? WHERE student_id = ?",
//         [newPasswordHash, user.student_id],
//         (err, result) => {
//           if (err) {
//             // Handle database error
//             return res.status(500).json({ message: "Database error" });
//           } else {
//             // Password changed successfully
//             return res
//               .status(200)
//               .json({ message: "Password changed successfully" });
//           }
//         }
//       );
//     } else {
//       // Current password doesn't match
//       return res.status(400).json({ message: "Current password is incorrect" });
//     }
//   });
// });
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const { student_id } = req.params;
  // Select user from the database
  const sql = "SELECT * FROM students WHERE student_id = ?";
  db.query(sql, [student_id], async (err, result) => {
    if (err) {
      // Handle database error
      return res.status(500).json({ message: "Database error" });
    }
    // Check if user exists
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];
    const currentPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );
    console.log(currentPasswordMatch);

    console.log(user);
    // Check if current password matches
    if (currentPasswordMatch) {
      const newPasswordHash = bcrypt.hashSync(newPassword, 8);
      console.log(newPasswordHash);

      // Update user's password
      db.query(
        "UPDATE students SET password = ?, password_changed_at = NOW() WHERE student_id = ?",
        [newPasswordHash, user.student_id],
        (err, result) => {
          if (err) {
            // Handle database error
            return res.status(500).json({ message: "Database error" });
          } else {
            // Password changed successfully
            return res
              .status(StatusCode.OK)
              .json({ message: "تم تغيير كلمة السر بنجاح" });
          }
        }
      );
    } else {
      // Current password doesn't match
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "كلمة السر الحالية غير صحيحة" });
    }
  });
});
