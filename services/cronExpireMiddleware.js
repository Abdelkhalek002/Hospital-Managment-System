//EXPIRE ACCOUNT EVERY FIRST DAY OF NEW YEAR
const cronJob = require("cron").CronJob;
const db = require("../config/db");

const job = new cronJob(
  "0 0 1 1 *",
  function (req, res) {
    try {
      const sql = "UPDATE students SET verified = 0 WHERE verified = 1";
      db.query(sql, (err, result) => {
        if (err) {
          res.status(500).send(err);
        }
        console.log(
          `Account Deactivated⏳...Rows updated: ${result.affectedRows}`
        );
      });
    } catch (error) {
      console.error("Error updating verified:", error);
    }
  },
  null,
  "Africa/Cairo"
);
exports.deActivateUser = () => {
  job.start();
};
