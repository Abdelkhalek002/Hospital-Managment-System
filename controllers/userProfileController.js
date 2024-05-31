const asyncHandler = require("express-async-handler");
const db = require("../config/db");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

//@desc user access profile data
//@route    POST  /api/v1/myProfile/:id
//@access   public
getStudentProfile = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  let sql =
    "SELECT students.*, levels.levelName AS level_name, faculties.facultyName AS faculty_name,governorates.govName AS gov_name , nationality.nationalityName AS nationality_name FROM students";
  sql += " LEFT JOIN levels ON students.level_id = levels.level_id";
  sql += " LEFT JOIN governorates ON students.gov_id = governorates.gov_id";
  sql +=
    " LEFT JOIN nationality ON students.nationality_id = nationality.nationality_id";
  sql += " LEFT JOIN faculties ON students.faculty_id = faculties.faculty_id";
  sql += " WHERE students.student_id = ?";

  db.query(sql, [student_id], (err, student) => {
    if (err) {
      res.status(500).json(err);
    } else if (student.length === 0) {
      res.status(404).json({ msg: `No student for this id ${student_id}` });
    } else {
      console.info("request created successfully");
      res.status(201).json({ student });
    }
  });
});

const multerStorage = multer.memoryStorage();
const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images are allowed", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
uploadUserImage = upload.single("userImage_file");

resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `profile-${uuidv4()}-${Date.now()}.jpeg`;

  const directory = "uploads/student_info/profile_pic";
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(path.join(directory, filename));

  req.body.userImage_file = filename;
  next();
});

//@desc user update profile data
//@route    POST  /api/v1/myProfile/:id
//@access   public
updateUserProfile = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { national_id, userImage_file, phoneNumber } = req.body;
  const sql =
    "UPDATE students SET national_id = ?, userImage_file = ?, phoneNumber = ? WHERE student_id = ?";
  db.query(
    sql,
    [national_id, userImage_file, phoneNumber, student_id],
    (err, result) => {
      if (err) {
        return res.status(400).json({ msg: err.message });
      } else {
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ msg: `No student found with ID ${student_id}` });
        } else {
          return res.status(200).json({ message: "تم تحديث البيانات بنجاح" });
        }
      }
    }
  );
});

getProfilePhoto = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { userImage_file } = req.body;
  const query = "UPDATE students SET userImage_file=? WHERE student_id=?";
  db.query(query, [userImage_file, student_id], (err, result) => {
    if (err) {
      console.error("Error updating user profile photo:", err);
      return res
        .status(500)
        .json({ message: "Error updating user profile photo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }
    return res
      .status(200)
      .json({ message: "User profile photo updated successfully", result });
  });
});

updateProfilePhoto = asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { userImage_file } = req.body;
  console.log(student_id);
  console.log(userImage_file);
  const query = "UPDATE students SET userImage_file=? WHERE student_id=?";
  db.query(query, [userImage_file, student_id], (err, result) => {
    if (err) {
      console.error("Error updating user profile photo:", err);
      return res
        .status(500)
        .json({ message: "Error updating user profile photo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }
    return res
      .status(200)
      .json({ message: "User profile photo updated successfully", result });
  });
});

module.exports = {
  getStudentProfile,
  uploadUserImage,
  resizeImage,
  updateUserProfile,
  updateProfilePhoto,
  getProfilePhoto,
};
