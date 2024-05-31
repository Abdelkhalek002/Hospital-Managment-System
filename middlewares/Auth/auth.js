const asyncHandler = require("express-async-handler");
const ApiError = require("../../utiles/apiError.js");
const db = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const apiError = require("../../utiles/apiError.js");
const { Roles } = require("../../utiles/Roles.js");
const { StatusCode } = require("../../utiles/statusCode.js");

Protect = asyncHandler(async (req, res, next) => {
  //1- extract type of user from token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new Error("You are not logged in. Please login to access this route !")
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //1- Protect (Admin)
  if (decoded.type === "admin") {
    console.log("admin access");
    // Check if the admin exists in the students table
    const AdminSql = "SELECT * FROM admins WHERE userName = ?";
    db.query(AdminSql, [decoded.name], (err, currentUser) => {
      if (err) {
        return res.status(500).send(err);
      } else if (!currentUser || currentUser.length === 0) {
        return next(
          new apiError(
            "The admin that belongs to this token no longer exists",
            401
          )
        );
      }
      //console.log(currentUser[0].password_changed_at);
      // 4-Check if user changed password after the token was issued (if applicable)
      if (currentUser[0].password_changed_at) {
        const passChangedTimestamp = Math.floor(
          new Date(currentUser[0].password_changed_at).getTime() / 1000
        );
        if (passChangedTimestamp > decoded.iat) {
          return res.status(401).json({
            status: "error",
            message:
              "Admin recently changed their password. Please Login again.",
          });
        }
      }
      // Attach the current user to the request object for further processing
      req.user = currentUser;
      next();
    });
  }
  //2- Protect (User)
  else if (decoded.type === "user") {
    console.log("user access");
    //A- Check if the user exists in the students table
    const userSql = "SELECT * FROM students WHERE student_id = ?";
    db.query(userSql, [decoded.userId], (err, currentUser) => {
      if (err) {
        return res.status(500).send(err);
      } else if (!currentUser || currentUser.length === 0) {
        return next(
          new ApiError(
            "The user that belongs to this token no longer exists",
            401
          )
        );
      }

      //B- Check if user changed password after the token was issued (if applicable)
      if (currentUser[0].password_changed_at) {
        const passChangedTimestamp = Math.floor(
          new Date(currentUser[0].password_changed_at).getTime() / 1000
        );

        if (passChangedTimestamp > decoded.iat) {
          return res.status(401).json({
            status: "error",
            message:
              "User recently changed their password. Please log in again.",
          });
        }
      }

      //C- Check if user allowed to access specific profile
      if (decoded.userId != req.params.student_id) {
        console.log(
          "user access denied" + decoded.userId + req.params.student_id
        );
        return next(
          new ApiError(
            "you are allowed to access your profile routes only 🤬",
            401
          )
        );
      }
      // Attach the current user to the request object for further processing
      req.user = currentUser;
      next();
    });
  }
  //3- Protect (Admin)
  else if (decoded.role === Roles.SUPER_ADMIN) {
    console.log("superAdmin access");
    // Check if the superAdmin exists in the students table
    const superAdminSql = "SELECT * FROM superadmin WHERE email = ?";
    db.query(superAdminSql, [decoded.email], (err, currentUser) => {
      if (err) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).send(err);
      } else if (!currentUser || currentUser.length === 0) {
        return next(
          new apiError(
            "The superAdmin that belongs to this token no longer exists",
            401
          )
        );
      }
      //console.log(currentUser[0].password_changed_at);
      // 4-Check if user changed password after the token was issued (if applicable)
      if (currentUser[0].password_changed_at) {
        const passChangedTimestamp = Math.floor(
          new Date(currentUser[0].password_changed_at).getTime() / 1000
        );
        if (passChangedTimestamp > decoded.iat) {
          return res.status(401).json({
            status: "error",
            message:
              "SuperAdmin recently changed their password. Please Login again.",
          });
        }
      }
      // Attach the current user to the request object for further processing
      req.user = currentUser;
      next();
    });
  }
});

//@desc    Authorization (User Permissions)
allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user[0].role)) {
      return next(
        new ApiError("You are not authorized to access this route!", 403)
      );
    }
    next();
  });

allowedToUser = (...type) =>
  asyncHandler(async (req, res, next) => {
    if (!type.includes(req.user[0].type)) {
      return next(
        new ApiError(
          "You are not authorized to access this route!",
          StatusCode.FORBIDDEN
        )
      );
    }
    next();
  });
module.exports = {
  Protect,
  allowedTo,
  allowedToUser,
};
