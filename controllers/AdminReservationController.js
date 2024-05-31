//IMPORTING DEPENDENCIES
const asyncHandler = require("express-async-handler");
const ApiError = require("../utiles/apiError");
const db = require("../config/db");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const sanitizeFilename = require("sanitize-filename");
const { StatusCode } = require("../utiles/statusCode.js");

/*
//upload image middleware
const multerStorage = multer.memoryStorage();
const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
const multerFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware to handle image and national ID upload
uploadAcceptanceDocs = upload.fields([
  { name: "acceptanceDoc1", maxCount: 1 },
  { name: "acceptanceDoc2", maxCount: 1 },
]);

// Middleware to resize uploaded image and save national ID
resizeFiles = async (req, res, next) => {
  try {
    // Resize and save profile image
    if (req.files["acceptanceDoc1"] && req.files["acceptanceDoc1"][0]) {
      const acceptanceDocs1_File = req.files["acceptanceDoc1"][0];
      const acceptanceDoc1_name = `Document-${uuidv4()}-${Date.now()}.jpeg`;
      const sanitizedDoc1_Filename = sanitizeFilename(acceptanceDoc1_name);
      const Doc1_Directory = "uploads/reservationDocs1/";

      if (!fs.existsSync(Doc1_Directory)) {
        fs.mkdirSync(Doc1_Directory, { recursive: true });
      }

      await sharp(acceptanceDocs1_File.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 95 })
        .toFile(path.join(Doc1_Directory, sanitizedDoc1_Filename));

      req.body.acceptanceDoc1 = sanitizedDoc1_Filename;
    }

    // Save national ID
    if (req.files["acceptanceDoc2"] && req.files["acceptanceDoc2"][0]) {
      const acceptanceDocs2_File = req.files["acceptanceDoc2"][0];
      const acceptanceDoc2_name = `Document-${uuidv4()}-${Date.now()}.jpeg`;
      const sanitizedDoc2_Filename = sanitizeFilename(acceptanceDoc2_name);
      const Doc2_Directory = "uploads/reservationDocs2/";

      if (!fs.existsSync(Doc2_Directory)) {
        fs.mkdirSync(Doc2_Directory, { recursive: true });
      }

      fs.writeFileSync(
        path.join(Doc2_Directory, sanitizedDoc2_Filename),
        acceptanceDocs2_File.buffer
      );

      req.body.acceptanceDoc2 = sanitizedDoc2_Filename;
    }

    next();
  } catch (error) {
    return next(error);
  }
};
*/

//!Emergency Reservations APIs
//@desc     submit medical examination request
//@route    POST  /api/v1/Reservations
//@access   private
adminCreateRequest = asyncHandler(async (req, res) => {
  const { Name, national_id } = req.body;

  const sql =
    "INSERT INTO emergency_reservations (Name,national_id) VALUES (?, ?)";
  db.query(sql, [Name, national_id], (err, result) => {
    if (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    } else {
      console.log("Request created successfully");
      // Insert audit record
      const auditData = {
        timestamp: new Date().toISOString(),
        method: "Create Emergency Medical Examination Request",
        body: {
          Name,
          national_id,
        },
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
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(auditErr);
          }
          console.log("Audit record created successfully:", auditResult);
        }
      );
      res.status(StatusCode.OK).json({ message: "تم الحجز بنجاح", auditData });
    }
  });
});
//@desc     modify medical examination request
//@route    PUT  /api/v1/Reservations/:emergencyUser_id
//@access   private
adminUpdateRequest = asyncHandler(async (req, res) => {
  const emergencyUser_id = req.params.emergencyUser_id;
  const { Name, national_id } = req.body;
  const checkSql =
    "SELECT * FROM emergency_reservations WHERE emergencyUser_id = ?";
  db.query(checkSql, [emergencyUser_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "Emergency Reservation ID not found" });
    }
    const updateSql =
      "UPDATE emergency_reservations SET Name = ?, national_id = ? WHERE emergencyUser_id = ?";
    db.query(
      updateSql,
      [Name, national_id, emergencyUser_id],
      (err, result) => {
        if (err) {
          return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
        } else {
          const auditData = {
            timestamp: new Date().toISOString(),
            method: "Update Emergency Medical Examination Request",
            body: { emergencyUser_id, Name, national_id },
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
                return res
                  .status(StatusCode.SERVICE_UNAVAILABLE)
                  .send(auditErr);
              }
              console.log("Audit record created successfully:", auditResult);
              res.status(StatusCode.OK).json({
                message: "تم تعديل الحجز بنجاح",
                auditData,
              });
            }
          );
        }
      }
    );
  });
});

//@desc     view medical examination request
//@route    GET  /api/v1/Reservations/:emergencyUser_id
//@access   private
adminViewRequest = asyncHandler(async (req, res) => {
  const emergencyUser_id = req.params.emergencyUser_id;
  const sql = "SELECT * FROM emergency_reservations WHERE emergencyUser_id = ?";
  db.query(sql, [emergencyUser_id], (err, results) => {
    if (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    } else {
      res.status(StatusCode.OK).json(results);
    }
  });
});

//@desc     view list of medical examinations
//@route    GET  /api/v1/Reservations
//@access   private
 adminGetAllReservations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1;
  const offset = (page - 1) * limit; // Calculate offset based on page and limit

  // Construct SQL query with JOINs
  let sql = `
    SELECT 
      medical_examinations.*,  
      clinics.clinicName AS clinic_name, 
      students.userName AS student_name 
    FROM 
      medical_examinations 
      LEFT JOIN clinics ON medical_examinations.clinic_id = clinics.clinic_id
      LEFT JOIN students ON medical_examinations.student_id = students.student_id
    LIMIT ? OFFSET ?`;

  // Execute the SQL query with limit and offset parameters
  db.query(sql, [limit, offset], (error, results) => {
    if (error) {
      console.error("Error fetching examinations data:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    } else {
      // Examinations found, return them
      res.status(StatusCode.OK).json(results);
    }
  });
});

module.exports = adminGetAllReservations;




//@desc     delete medical examination request
//@route    DELETE  /api/v1/Reservations/:emergencyUser_id
//@access   private
adminDeleteRequest = asyncHandler(async (req, res) => {
  const emergencyUser_id = req.params.emergencyUser_id;

  const checkSql =
    "SELECT * FROM emergency_reservations WHERE emergencyUser_id = ?";
  db.query(checkSql, [emergencyUser_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(checkErr);
    }
    if (checkResult.length === 0) {
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ error: "Emergency Reservation ID not found" });
    }

    const deleteSql =
      "DELETE FROM emergency_reservations WHERE emergencyUser_id = ?";
    db.query(deleteSql, [emergencyUser_id], (err, result) => {
      if (err) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
      }
      const auditData = {
        timestamp: new Date().toISOString(),
        method: "Delete Emergency Medical Examination Request",
        body: {
          emergencyUser_id: emergencyUser_id,
          deletedCount: result.affectedRows,
        },
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
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(auditErr);
          }
          console.log("Audit record created successfully:", auditResult);
          res.status(StatusCode.OK).json({ message: "تم حذف الحجز بنجاح" });
        }
      );
    });
  });
});

module.exports = {
  adminCreateRequest,
  adminUpdateRequest,
  adminViewRequest,
  adminGetAllReservations,
  adminDeleteRequest,
};
