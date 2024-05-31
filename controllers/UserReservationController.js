//IMPORTING DEPENDENCIES
const asyncHandler = require("express-async-handler");
const db = require("../config/db");

//validtion methods
const { isLimitReached } = require("../utiles/validators/ReservationValidator");
const { StatusCode } = require("../utiles/statusCode.js");

//@desc     submit medical examination request
//@route    POST  /api/v1/myreservations
//@access   public
createRequest = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { clinic_id, date, examType } = req.body;
  const { StatusCode } = require("../utiles/statusCode.js");

  //1-check if reservation limit reached
  db.query(
    "SELECT * FROM medical_examinations WHERE date = ?",
    [req.body.date],
    (err, results) => {
      if (isLimitReached(err, results)) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ error: "reservations limit reached!" });
      } else {
        //2- check if user exists...
        db.query(
          "SELECT * FROM students WHERE student_id = ?",
          [student_id],
          (error, results) => {
            if (error) {
              console.error("Error checking student existence:", error);
              return res
                .status(StatusCode.INTERNAL_SERVER_ERROR)
                .json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
              // student is not in system, return error response
              return res
                .status(StatusCode.BAD_REQUEST)
                .json({ error: `غير موجود  ${student_id}المستخدم ` });
            }
            //3- method code...
            const sql =
              "INSERT INTO medical_examinations (student_id, clinic_id, date, examType) VALUES (?, ?, ?, ?)";
            db.query(
              sql,
              [student_id, clinic_id, date, examType],
              (err, result) => {
                if (err) {
                  res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
                } else {
                  console.log("request created successfully");
                  res
                    .status(StatusCode.CREATED)
                    .json({ message: "تم حجز الكشف بنجاح" });
                }
              }
            );
          }
        );
      }
    }
  );
});

//@desc     modify medical examination request
//@route    PUT  /api/v1/myreservations
//@access   public
updateRequest = asyncHandler(async (req, res) => {
  const { medicEx_id } = req.params;
  const { clinic_id, date, examType } = req.body;
  //1-check if medical examination exists
  db.query(
    "SELECT * FROM medical_examinations WHERE  medicEx_id = ?",
    [medicEx_id],
    (error, results) => {
      if (error) {
        console.error("Error checking examination existence:", error);
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ error: "Internal Server Error" });
      } else if (results.length === 0) {
        // examination is not in system, return error response
        return res.status(StatusCode.NOT_FOUND).json({
          error: `الكشف رقم ${medicEx_id} غير موجود`,
        });
      }
      //2- method code...
      const sql =
        "UPDATE medical_examinations SET clinic_id = ?, date = ?, examType = ? WHERE medicEx_id = ?";
      db.query(sql, [clinic_id, date, examType, medicEx_id], (err, result) => {
        if (err) {
          res.status(StatusCode.BAD_REQUEST).send(err);
        } else {
          res
            .status(StatusCode.CREATED)
            .json({ message: "تم تعديل الحجز بنجاح", medicEx_id });
        }
      });
    }
  );
});

//@desc     view medical examination request
//@route    GET  /api/v1/myreservations
//@access   public
viewRequest = asyncHandler(async (req, res) => {
  const { medicEx_id } = req.params;
  // SQL query to fetch examination details along with clinic names
  let sql = `
    SELECT 
      medical_examinations.*,  
      clinics.clinicName AS clinic_name
    FROM 
      medical_examinations 
      LEFT JOIN clinics ON medical_examinations.clinic_id = clinics.clinic_id
    WHERE 
      medical_examinations.medicEx_id = ?`;

  // Check if medical exam exists
  db.query(sql, [medicEx_id], (error, results) => {
    if (error) {
      console.error("Error checking examination existence:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    } else if (results.length === 0) {
      // Medical examination not found, return error response
      return res.status(StatusCode.NOT_FOUND).json({
        error: `الكشف رقم ${medicEx_id} غير موجود`,
      });
    } else {
      // Medical examination found, return details
      res.status(StatusCode.OK).json(results);
    }
  });
});


//@desc     view all my medical examinations
//@route    GET  /api/v1/myreservations
//@access   public
getMyReservations = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  let sql = `
    SELECT 
      medical_examinations.*,  
      clinics.clinicName AS clinic_name, 
      students.userName AS student_name 
    FROM 
      medical_examinations 
      LEFT JOIN clinics ON medical_examinations.clinic_id = clinics.clinic_id
      LEFT JOIN students ON medical_examinations.student_id = students.student_id
    WHERE 
      medical_examinations.student_id = ?`;

  db.query(sql, [student_id], (error, results) => {
    if (error) {
      console.error("Error fetching examinations data:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    } else if (results.length === 0) {
      // No examination records found for the student
      return res.status(StatusCode.BAD_REQUEST).json({ error: "Student has no examination record!" });
    } else {
      // Examinations found, return them
      res.status(StatusCode.OK).json(results);
    }
  });
});


//! Cancel req only if its not already accepted🥰
cancelRequest = asyncHandler(async (req, res) => {
  const { medicEx_id } = req.params;
  // Check if the medical examination exists
  const isExitQuery = "SELECT * FROM medical_examinations WHERE medicEx_id=?";
  db.query(isExitQuery, [medicEx_id], (err, result) => {
    if (err) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
    } else if (result.length === 0) {
      return res.status(StatusCode.NOT_FOUND).json({ error: "الكشف غير موجود" });
    } else {
      // Check if the examination has been accepted
      if (result[0].status === "مقبول") {
        return res.status(StatusCode.BAD_REQUEST).json({ error: "لا يمكن الغاء الكشف لانه تم قبوله" });
      } else {
        // Delete the medical examination
        const deleteQuery = "DELETE FROM medical_examinations WHERE medicEx_id=?";
        db.query(deleteQuery, [medicEx_id], (err, result) => {
          if (err) {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
          } else {
            return res.status(StatusCode.OK).json({ message: "تم الغاء الكشف بنجاح" });
          }
        });
      }
    }
  });
});

module.exports = {
  createRequest,
  updateRequest,
  viewRequest,
  getMyReservations,
  cancelRequest,
};


