const asyncHandler = require("express-async-handler");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const ApiError = require("../utiles/apiError.js");
const { sendObservationMail } = require("../services/sendObservationemail.js");
const { StatusCode } = require("../utiles/statusCode.js");

//!! SUPER ADMIN
//! Get Admin Logs For
getAdminLogs = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM admin_log";
  db.query(sql, (err, result) => {
    if (err) {
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في استرجاع العمليات المسجلة" });
    }
    res.status(StatusCode.OK).json(result);
  });
});

//! Get Specific Admin Logs
getSpecificAdminLogs = asyncHandler(async (req, res) => {
  const { admin_id } = req.params;
  const sql = "SELECT * FROM admin_log WHERE admin_id = ?";
  db.query(sql, [admin_id], (err, result) => {
    if (err) {
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في استرجاع العمليات المسجلة" });
    }
    res.status(StatusCode.OK).json(result);
  });
});

//! Clear History
clearHistory = asyncHandler(async (req, res) => {
  const sql = "DELETE FROM admin_log";
  db.query(sql, (err, result) => {
    if (err) {
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في حذف العمليات المسجلة" });
    }
    res.status(StatusCode.OK).json({ message: "تم حذف العمليات المسجلة" });
  });
});

//! Clear Specific Admin History
clearSpecificHistory = asyncHandler(async (req, res) => {
  const { admin_id } = req.params;

  const isExist = `SELECT * FROM admin_log WHERE admin_id = ?`;
  db.query(isExist, [admin_id], (err, result) => {
    if (err) {
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "Database query error" });
    }
    // Check if result is undefined or empty
    if (!result || result.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "العمليات الخاصة بهذا المستخدم غير موجودة" });
    }

    // If logs exist, proceed with deletion
    const sql = "DELETE FROM admin_log WHERE admin_id=?";
    db.query(sql, [admin_id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to clear admin logs" });
      }
      return res
        .status(StatusCode.OK)
        .json({ message: "تم حذف العمليات المسجلة" });
    });
  });
});

//@desc     add new admin
//@route    POST  /api/v1/admin
//@access   private
addNewAdmin = asyncHandler(async (req, res) => {
  const { userName, email, password, role } = req.body;
  // Check for authorization
  if (!req.user) {
    return res.status(StatusCode.UNAUTHORIZED).json({ error: "Unauthorized" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const selectSql = "SELECT userName, email, role FROM admins WHERE email = ?";
  db.query(selectSql, [email], (selectErr, selectResult) => {
    if (selectErr) {
      console.error("Error checking existing admin:", selectErr);
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في اضافة ادمن جديد" });
    }
    if (selectResult.length > 0) {
      return res
        .status(StatusCode.CONFLICT)
        .json({ error: "هذا الادمن موجود بالفعل" });
    }
    const insertSql =
      "INSERT INTO admins (userName, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(
      insertSql,
      [userName, email, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error("Error adding new admin:", err);
          return res
            .status(StatusCode.INTERNAL_SERVER_ERROR)
            .json({ error: "فشل في اضافة ادمن جديد" });
        }

        const auditData = {
          timestamp: new Date().toISOString(),
          method: "Add New Admin",
          body: { userName, email, role },
          adminName: req.user[0].userName,
          admin_id: req.user[0].user_id,
        };

        const auditSql =
          "INSERT INTO admin_log (admin_id,admin_name,timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
        db.query(
          auditSql,
          [
            auditData.admin_id,
            auditData.adminName,
            auditData.timestamp,
            auditData.method,
            JSON.stringify(auditData.body),
          ],
          (auditErr, auditResult) => {
            if (auditErr) {
              console.error("Error creating audit record:", auditErr);
            } else {
              console.log("Audit record created successfully :", auditResult);
            }
          }
        );

        return res
          .status(StatusCode.CREATED)
          .json({ message: "تم اضافة ادمن جديد بنجاح" });
      }
    );
  });
});

// !!
addSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectSql = "SELECT name, email, role FROM superadmin WHERE email = ?";
  db.query(selectSql, [email], (selectErr, selectResult) => {
    if (selectErr) {
      console.error("Error checking existing admin:", selectErr);
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في اضافة مدير نظام جديد" });
    }
    if (selectResult.length > 0) {
      return res
        .status(StatusCode.CONFLICT)
        .json({ error: "مدير النظام هذا موجود بالفعل" });
    }
    const insertSql =
      "INSERT INTO superadmin (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(insertSql, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error("Error adding new superadmin:", err);
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ error: "فشل في اضافة مدير نظام جديد" });
      } else {
        return res
          .status(StatusCode.CREATED)
          .json({ message: "تم اضافة مدير نظام جديد" });
      }
    });
  });
});

//@desc     update admin
//@route    PUT  /api/v1/admin/:user_id
//@access   private
// updateAdmin = asyncHandler(async (req, res) => {
//   const { user_id } = req.params;
//   const updateData = req.body;
//   let updateSet = "";
//   const updateValues = [];
//   // Build the SET clause for the update query
//   Object.entries(updateData).forEach(([field, value]) => {
//     updateSet += `${field} = ?, `;
//     updateValues.push(value);
//   });
//   // Remove the trailing comma from the SET clause
//   updateSet = updateSet.slice(0, -2);
//   // Update the admin in the database
//   const query = `UPDATE admins SET ${updateSet} WHERE user_id = ?`;
//   db.query(query, [...updateValues, user_id], (err, result) => {
//     if (err) {
//       return res.status(500).send(err);
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Admin not found" });
//     }
//     const selectSql =
//       "SELECT userName, email, role FROM admins WHERE user_id = ?";
//     db.query(selectSql, [user_id], (selectErr, selectResult) => {
//       if (selectErr) {
//         console.error("Error fetching updated admin details:", selectErr);
//         return res.status(500).send(selectErr);
//       }
//       if (selectResult.length === 0) {
//         return res.status(404).json({ message: "Admin not found" });
//       }
//       const { userName, email, role } = selectResult[0];
//       const auditData = {
//         timestamp: new Date().toISOString(),
//         method: "Update Admin",
//         body: {
//           updatedFields: updateData,
//           userName,
//           email,
//           role,
//         },
//         admin_id: req.user[0].user_id,
//         adminName: req.user[0].userName,
//       };
//       const auditSql =
//         "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
//       db.query(
//         auditSql,
//         [
//           auditData.admin_id,
//           auditData.adminName,
//           auditData.timestamp,
//           auditData.method,
//           JSON.stringify(auditData.body),
//         ],
//         (auditErr, auditResult) => {
//           if (auditErr) {
//             console.error("Error creating audit record:", auditErr);
//             return res.status(500).send(auditErr);
//           }
//           console.log("Audit record created successfully:", auditResult);
//           return res
//             .status(StatusCode.OK)
//             .json({ message: "Admin updated successfully", auditData });
//         }
//       );
//     });
//   });
// });
updateAdmin = asyncHandler(async (req, res) => {
  const user_id = req.params.user_id;
  const { userName, email, role } = req.body;

  // Check if the admin exists
  const checkSql = "SELECT * FROM admins WHERE user_id = ?";
  db.query(checkSql, [user_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "الادمن غير موجود" });
    }

    // Update admin details
    const updateSql =
      "UPDATE admins SET userName = ?, email = ?, role = ? WHERE user_id = ?";
    db.query(updateSql, [userName, email, role, user_id], (err, result) => {
      if (err) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
      } else {
        // Create audit record
        // const auditData = {
        //   timestamp: new Date().toISOString(),
        //   method: "Update Admin",
        //   body: { user_id, userName, email, role },
        //   adminName: req.user[0].name,
        //   admin_id: req.user[0].superAdmin_id,
        // };
        // const auditSql = "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
        // db.query(
        //   auditSql,
        //   [
        //     auditData.admin_id,
        //     auditData.adminName,
        //     auditData.timestamp,
        //     auditData.method,
        //     JSON.stringify(auditData.body),
        //   ],
        //   (auditErr, auditResult) => {
        //     if (auditErr) {
        //       console.error("Error creating audit record:", auditErr);
        //       return res.status(StatusCode.SERVICE_UNAVAILABLE).send(auditErr);
        //     }
        //     console.log("Audit record created successfully:", auditResult);
        res
          .status(StatusCode.OK)
          .json({ message: "تم تعديل بيانات الادمن بنجاج" });
      }
    });
  });
});
//  }
//   });
// });
//@desc     reset admin password
//@route    PATCH  /api/v1/admin/:user_id
//@access   private
resetPassword = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 8);
  // Update password in the database
  const updatePasswordQuery = `UPDATE admins SET password = ? WHERE user_id = ?`;
  db.query(updatePasswordQuery, [hashedPassword, user_id], (err, result) => {
    if (err) {
      console.error("Error updating password:", err);
      return res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ error: "فشل في تحديث كلمة السر" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "الادمن غير موجود او لم يتم تحديث كلمة السر" });
    }
    const updateStatusQuery = "UPDATE admins SET status = 0 WHERE user_id = ?";
    db.query(updateStatusQuery, [user_id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Error updating admin status:", updateErr);
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ error: "فشل في تحديث حالة الادمن" });
      }

      const auditData = {
        timestamp: new Date().toISOString(),
        method: "Reset Password",
        body: {
          user_id,
          newPassword: password,
        },
        admin_id: req.user[0].user_id,
        adminName: req.user[0].userName,
      };
      // const auditSql =
      //   "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
      // db.query(
      //   auditSql,
      //   [
      //     auditData.admin_id,
      //     auditData.adminName,
      //     auditData.timestamp,
      //     auditData.method,
      //     JSON.stringify(auditData.body),
      //   ],
      //   (auditErr, auditResult) => {
      //     if (auditErr) {
      //       console.error("Error creating audit record:", auditErr);
      //       return res
      //         .status(StatusCode.INTERNAL_SERVER_ERROR)
      //         .json({ error: "Failed to audit password reset" });
      //     }
      //     console.log("Audit record created successfully:", auditResult);
      return res
        .status(StatusCode.OK)
        .json({ message: "تم تغيير كلمة السر بنجاح", auditData });
    });
  });
});
// });

//@desc    view specific admin
//@route   GET /api/v1/admin/:user_id
//@access  private
viewAdmin = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const sql = "SELECT * FROM admins WHERE user_id = ?";

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    } else {
      console.log(result);
      if (result.length === 0) {
        res.status(StatusCode.NOT_FOUND).json({ message: "الادمن غير موجود" });
      } else {
        res.status(StatusCode.OK).json(result);
      }
    }
  });
});

//@desc     view all admins
//@route    GET  /api/v1/admin
//@access   private
getAllAdmin = asyncHandler(async (req, res) => {
  const sql = "SELECT * FROM admins";
  db.query(sql, (err, result) => {
    if (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    } else {
      console.log("request created successfully");
      res.status(StatusCode.OK).json(result);
    }
  });
});

//@desc     delete admin
//@route    DELETE  /api/v1/admin/:user_id
//@access   private
deleteAdmin = asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  const selectSql =
    "SELECT userName, email, role FROM admins WHERE user_id = ?";
  db.query(selectSql, [user_id], (selectErr, selectResult) => {
    if (selectErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(selectErr);
    }
    if (selectResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "الادمن غير موجود" });
    }
    const { userName, email, role } = selectResult[0];
    const deleteSql = "DELETE FROM admins WHERE user_id = ?";
    db.query(deleteSql, [user_id], (deleteErr) => {
      if (deleteErr) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(deleteErr);
      }
      const auditData = {
        timestamp: new Date().toISOString(),
        method: "Delete Admin",
        body: { userName, email, role },
        admin_id: req.user[0].user_id,
        adminName: req.user[0].userName,
      };

      const auditSql =
        "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
      db.query(
        auditSql,
        [
          auditData.admin_id,
          auditData.adminName,
          auditData.timestamp,
          auditData.method,
          JSON.stringify(auditData.body),
        ],
        (auditErr, auditResult) => {
          if (auditErr) {
            console.error("Error creating audit record:", auditErr);
          } else {
            console.log("Audit record created successfully:", auditResult);
          }
        }
      );

      res
        .status(StatusCode.OK)
        .json({ message: "تم حذف الادمن بنجاح", auditData });
    });
  });
});


//! ADMIN PRVILIGES FROM HERE
//@desc     send observation to a user
//@route    PUT  /api/v1/admin/sendObservation/:id
//@access   private
sendObservation = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { observation } = req.body;
  const sql = "SELECT email, userName FROM students WHERE student_id = ?";
  db.query(sql, [student_id], (err, result) => {
    if (err) {
      console.error("Error querying user:", err);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    }
    if (result.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ message: "المستخدم غير موجود" });
    }
    const { email, userName } = result[0];
    console.log(userName, email, observation);
    sendObservationMail(email, observation, userName);
    const auditData = {
      timestamp: new Date().toISOString(),
      method: "Send Observation",
      body: { student_id, observation },
      admin_id: req.user[0].user_id,
      adminName: req.user[0].userName,
    };
    const auditSql =
      "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
    db.query(
      auditSql,
      [
        auditData.admin_id,
        auditData.adminName,
        auditData.timestamp,
        auditData.method,
        JSON.stringify(auditData.body),
      ],
      (auditErr, auditResult) => {
        if (auditErr) {
          console.error("Error creating audit record:", auditErr);
        } else {
          console.log("Audit record created successfully:", auditResult);
        }
      }
    );
    res
      .status(StatusCode.OK)
      .json({ message: "تم تسجيل الملاحظة", user: result[0] });
  });
});

//accept or decline requests
acceptOrDecline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM medical_examinations WHERE medicEx_id = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error checking medical examination:", error);
        return res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal Server Error" });
      } else if (results.length === 0) {
        return res
          .status(StatusCode.NOT_FOUND)
          .json({ error: `الكشف رقم ${id} غير موجود ` });
      }
      db.query(
        'UPDATE medical_examinations SET status = "مقبول" WHERE medicEx_id = ?',
        [id],
        (err, result) => {
          if (err) {
            console.error("Error updating medical examination status:", err);
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
          }
          const auditData = {
            timestamp: new Date().toISOString(),
            method: "Accept Medical Examination",
            body: { id },
            admin_id: req.user[0].user_id,
            adminName: req.user[0].userName,
          };
          const auditSql =
            "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
          db.query(
            auditSql,
            [
              auditData.admin_id,
              auditData.adminName,
              auditData.timestamp,
              auditData.method,
              JSON.stringify(auditData.body),
            ],
            (auditErr, auditResult) => {
              if (auditErr) {
                console.error("Error creating audit record:", auditErr);
              } else {
                console.log("Audit record created successfully:", auditResult);
              }
            }
          );
          return res.status(StatusCode.OK).json({
            message: "تم قبول الكشف ",
            result,
          });
        }
      );
    }
  );
});

//@desc     view all user profiles
//@route    GET  /api/v1/admin
//@access   private
getAllUserProfiles = asyncHandler(async (req, res) => {
  //console.log(req.user);
  // const { student_id } = req.params;
  let sql =
    "SELECT students.*, levels.levelName AS level_name, faculties.facultyName AS faculty_name,governorates.govName AS gov_name , nationality.nationalityName AS nationality_name FROM students";
  sql += " LEFT JOIN levels ON students.level_id = levels.level_id";
  sql += " LEFT JOIN governorates ON students.gov_id = governorates.gov_id";
  sql +=
    " LEFT JOIN nationality ON students.nationality_id = nationality.nationality_id";
  sql += " LEFT JOIN faculties ON students.faculty_id = faculties.faculty_id";

  db.query(sql, (err, students) => {
    if (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json(err);
    } else {
      console.info("request created successfully");
      res.status(StatusCode.OK).json(students);
    }
  });
});


//@desc     add students
//@route    POST  /api/v1/admin
//@access   private
addStudent = asyncHandler(async (req, res) => {
  const {
    userName,
    email,
    password,
    national_id,
    phone,
    level_id,
    gov_id,
    faculty_id,
  } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkSql = "SELECT * FROM students WHERE national_id = ?";
  db.query(checkSql, [national_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length > 0) {
      return res
        .status(StatusCode.CONFLICT)
        .json({ error: "الرقم القومي موجود بالفعل" });
    }
    const insertSql =
      "INSERT INTO students (userName, email, password, national_id, phone, address, level_id, gov_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
      insertSql,
      [userName, email, hashedPassword, national_id, phone, address, level_id, gov_id, faculty_id],
      (err, result) => {
        if (err) {
          return res.status(StatusCode.INTERNAL_SERVER_ERROR
          ).send(err);
        }
        return res
          .status(StatusCode.CREATED)
          .json({ message: "تم اضافة الطالب بنجاح" });
      }
    );
  });
});

//@desc     update user profiles
//@route    GET  /api/v1/admin
//@access   private
updateUserProfile = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  //check if user already exists
  const checkSql = "SELECT * FROM students WHERE student_id = ?";
  db.query(checkSql, [student_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "المستخدم غير موجود" });
    }
    const { userName, email, password, national_id, phone, address, level_id, gov_id, faculty_id } = req.body;
    const updateSql = `UPDATE students SET userName = ?, email = ?, national_id = ?, phone = ?,  level_id = ?, gov_id = ? ,faculty_id WHERE student_id = ?`;
    //check if the national id is already exist
    const checkNationalId = "SELECT * FROM students WHERE national_id = ? AND student_id != ?";
    db.query(checkNationalId, [national_id, student_id], (checkNationalIdErr, checkNationalIdResult) => {
      if (checkNationalIdErr) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkNationalIdErr);
      }
      if (checkNationalIdResult.length > 0) {
        return res
          .status(StatusCode.CONFLICT)
          .json({ error: "الرقم القومي موجود بالفعل" });
      }
    });
    db.query(updateSql, [userName, email, national_id, phone, level_id, gov_id, faculty_id, student_id], (err, result) => {
      if (err) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
      }
      return res
        .status(StatusCode.OK)
        .json({ message: "تم تعديل بيانات المستخدم بنجاح" });
    });
  });
});

//@desc     delete user profiles
//@route    GET  /api/v1/admin
//@access   private
deleteUserProfile = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const checkSql = "SELECT * FROM students WHERE student_id = ?";
  db.query(checkSql, [student_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "المستخدم غير موجود" });
    }
    const deleteSql = "DELETE FROM students WHERE student_id = ?";
    db.query(deleteSql, [student_id], (deleteErr) => {
      if (deleteErr) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(deleteErr);
      }
      return res
        .status(StatusCode.OK)
        .json({ message: "تم حذف المستخدم بنجاح" });
    });
  });
});

//!@desc PLUS    block the user from entering the system
//@route    GET  /api/v1/admin
//@access   private
blockUser = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const checkSql = "SELECT * FROM students WHERE student_id = ?";
  db.query(checkSql, [student_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "المستخدم غير موجود" });
    }
    const blockSql = "UPDATE students SET status = 0 WHERE student_id = ?";
    db.query(blockSql, [student_id], (blockErr) => {
      if (blockErr) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(blockErr);
      }
      return res
        .status(StatusCode.OK)
        .json({ message: "تم حظر المستخدم بنجاح" });
    });
  });
});

//search for students method
searchStudent = asyncHandler(async (req, res) => {
  const { searchKey } = req.query;
  const sql =
    "SELECT * FROM students WHERE userName LIKE ? OR national_id LIKE ?";
  db.query(sql, [`%${searchKey}%`, `%${searchKey}%`], (err, results) => {
    if (err) {
      res.status(400).json({ msg: err.message });
    } else {
      if (results.length === 0) {
        res.status(404).json({ msg: "No students found" });
      } else {
        res.status(200).json({ data: results });
      }
    }
  });
});

//advanced search method
advancedSearch = asyncHandler(async (req, res) => {
  const queryParams = [];
  let query = "SELECT * FROM students WHERE";
  let conditions = [];

  // Build the WHERE clause for the search query
  for (const [key, value] of Object.entries(req.query)) {
    if (value) {
      conditions.push(`${key} LIKE ?`);
      queryParams.push(`%${value}%`);
    }
  }
  // Check if any search criteria provided
  if (conditions.length === 0) {
    return res.status(400).json({ message: "No search criteria provided" });
  }
  query += " " + conditions.join(" AND ");
  // Execute the search query
  db.query(query, queryParams, (err, students) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    // Handle the response
    if (students.length === 0) {
      return res.status(404).json({ msg: "No students found" });
    } else {
      return res.status(200).json({ data: students });
    }
  });
});

//filter students method
filterStudents = asyncHandler(async (req, res) => {
  const filters = req.query;
  const values = [];
  const conditions = [];

  Object.entries(filters).forEach(([key, value]) => {
    conditions.push(`students.${key} = ?`);
    values.push(value);
  });

  let sql =
    "SELECT students.*, levels.levelName AS level_name, governorates.govName AS gov_name , nationality.nationalityName AS nationality_name FROM students";
  sql += " LEFT JOIN levels ON students.level_id = levels.level_id";
  sql += " LEFT JOIN governorates ON students.gov_id = governorates.gov_id";
  sql +=
    " LEFT JOIN nationality ON students.nationality_id = nationality.nationality_id";

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  db.query(sql, values, (err, results) => {
    if (err) {
      res.status(400).json({ msg: err.message });
    } else {
      if (!results || results.length === 0) {
        res.status(404).json({ msg: "No students found" });
      } else {
        res.status(200).json({ data: results });
      }
    }
  });
});



//////////////////////// TEST FUNCTIONS //////////////////////////
// !TRANSFER
// Function to check the medical examination status
async function checkMedicalExamStatus(medicEx_id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT status FROM medical_examinations WHERE medicEx_id = ? AND status = 'مقبول'", [medicEx_id], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to check if a student exists
async function checkStudentExist(student_id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM students WHERE student_id = ?", [student_id], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

//Function to check if the clinic exists
async function checkClinicExist(clinic_id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM clinics WHERE clinic_id = ?", [clinic_id], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  }
  );
}

// Function to check if the external hospital exists
async function checkExHospExist(exHosp_id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM external_hospitals WHERE exHosp_id = ?", [exHosp_id], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  }
  );
}


// Function to check for existing transfers
async function checkExistingTransfer(medicEx_id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM transfers WHERE medicEx_id = ?", [medicEx_id], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to insert transfer records
async function insertTransferRecord(student_id, transferReason, notes, medicEx_id, clinic_id, exHosp_id) {
  return new Promise((resolve, reject) => {
    const transferQuery = "INSERT INTO transfers (student_id, transferReason, notes, medicEx_id, clinic_id, exHosp_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [student_id, transferReason, notes, medicEx_id, clinic_id, exHosp_id];
    db.query(transferQuery, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to insert audit logs
async function insertAuditLog(auditData) {
  return new Promise((resolve, reject) => {
    const auditSql = "INSERT INTO admin_log (admin_id, admin_name, timestamp, method, body) VALUES (?, ?, ?, ?, ?)";
    db.query(auditSql, [auditData.admin_id, auditData.adminName, auditData.timestamp, auditData.method, JSON.stringify(auditData.body)], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
//transfer to external hospital
transfer = asyncHandler(async (req, res) => {
  const {
    student_id,
    transferReason,
    notes,
    medicEx_id,
    clinic_id,
    exHosp_id,
  } = req.body;

  try {
    // Check if the medical examination status is 'مقبول'
    const medicalExamResult = await checkMedicalExamStatus(medicEx_id);
    if (medicalExamResult.length === 0) {
      throw new Error('Medical examination not accepted');
    }

    // Check if the student_id exists in the students table
    const studentResult = await checkStudentExist(student_id);
    if (studentResult.length === 0) {
      throw new Error('Invalid student_id');
    }

    // Check if the transfer has already been done
    const existingTransfer = await checkExistingTransfer(medicEx_id);
    if (existingTransfer.length > 0) {
      throw new Error('Transfer already done for this student');
    }

    // Check if the clinic_id exists in the clinics table
    const clinicResult = await checkClinicExist(clinic_id);
    if (clinicResult.length === 0) {
      throw new Error('Invalid clinic_id');
    }

    // Check if the exHosp_id exists in the external_hospitals table
    const exHospResult = await checkExHospExist(exHosp_id);
    if (exHospResult.length === 0) {
      throw new Error('Invalid exHosp_id');
    }

    // Insert transfer record
    await insertTransferRecord(student_id, transferReason, notes, medicEx_id, clinic_id, exHosp_id);

    // Audit log
    const auditData = {
      timestamp: new Date().toISOString(),
      method: 'Transfer Student',
      body: {
        student_id,
        transferReason,
        notes,
        medicEx_id,
        clinic_id,
        exHosp_id,
      },
      adminName: req.user[0].userName,
      admin_id: req.user[0].user_id,
    };
    await insertAuditLog(auditData);

    res.status(200).json({ message: 'Transferred successfully', auditData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




module.exports = {
  addNewAdmin,
  addSuperAdmin,
  viewAdmin,
  getAllAdmin,
  deleteAdmin,
  updateAdmin,
  resetPassword,
  sendObservation,
  acceptOrDecline,
  getAdminLogs,
  getSpecificAdminLogs,
  clearHistory,
  clearSpecificHistory,
  searchStudent,
  advancedSearch,
  filterStudents,
  transfer,
  addStudent,
  updateUserProfile,
  deleteUserProfile,
  blockUser,
  getAllUserProfiles,
};
