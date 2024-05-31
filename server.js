//IMPORTING DEPENDENCIES
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config({ path: "config.env" });
const ApiError = require("./utiles/apiError");
const globalError = require("./middlewares/errorMiddleware");

//ROUTES
const userReservationRoute = require("./APIs/UserReservationRoute");
const adminReservationRoute = require("./APIs/AdminReservationRoute");
const authRoute = require("./APIs/authRoute");
const adminCrudRoute = require("./APIs/AdminCrudRoute.js");
const userProfileRoute = require("./APIs/userProfileRoute.js");

//system data routes
const levelsRoute = require("./APIs/systemDataApis/levelsRoute");
const govsRoute = require("./APIs/systemDataApis/govsRoute");
const clinicsRoute = require("./APIs/systemDataApis/clinicsRoute");
const facultyRoute = require("./APIs/systemDataApis/facultyRoute");
const hospRoute = require("./APIs/systemDataApis/hospRoute");
/*const nationalityRoute = require("./APIs/systemDataApis/");*/

const userSecRoute = require("./APIs/userSecRoute");

//express app
const app = express();
const cors = require('cors');
app.use(cors());

//DATABASE CONNECTION
const dbConnection = require("./config/db");
const { deActivateUser } = require("./services/cronExpireMiddleware.js");

dbConnection.connect((err) => {
  if (err) {
    console.error("Unable to connect to MySQL:", err);
    return;
  } else {
    console.log(`${process.env.PROD_DB} DB Connected 🚀`);
  }
});

//MIDDLEWARE FOR PARSING JSON REQUESTS
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

//MOUNT ROUTES
app.use("/api/v1/Myreservations/", userReservationRoute);
app.use("/api/v1/reservations/", adminReservationRoute);
app.use("/api/v1/auth/", authRoute);
app.use("/api/v1/admin/", adminCrudRoute);
app.use("/api/v1/password/", userSecRoute);
app.use("/api/v1/myProfile/", userProfileRoute);
app.use(
  "/api/v1/sysdata/",
  levelsRoute,
  govsRoute,
  clinicsRoute,
  facultyRoute,
  hospRoute
);

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

//GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalError);

// Start the server and store the result in a variable
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT} `);
});

//DEACTIVATE ACCOUNTS
deActivateUser();
//HANDLING REJECTIONS OUTSIDE EXPRESS
process.on("unhandledRejection", (err) => {
  console.log(`unhandled error: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log("shutting down....");
    process.exit(1);
  });
});
