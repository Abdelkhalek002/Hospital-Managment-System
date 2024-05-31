const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.sendActivationMail = async (email, name) => {
  // 1- Sign JWT token with user information and set expiration to 50 seconds
  const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "120s",
  });
  //2- prepare activation mail for user
  const recipientEmail = email;
  const activationLink = `http://localhost:7000/api/v1/auth/activate?token=${activationToken}`;
  const emailBody = `<style>
  body {
     background-color: #001f3f;
     color: #ffffff;
     font-family: 'Tajawal', sans-serif;
     margin: 0;
     padding: 0;
 }

 .container {
     max-width: 600px;
     margin: 0 auto;
     padding: 20px;
     text-align: center;
     border-radius: 16px;
 }

 h1 {
     color: #fff;
     margin-bottom: 20px;
 }

 p {
     margin: 20px 0;
     font-size: 18px;
 }

 a {
     display: inline-block;
     padding: 15px 30px;
     text-decoration: none;
     background-color: #004080;
     color: #ffffff;
     border-radius: 15px;
     font-weight: bold;
 }

 .expiry {
     color: red;
     margin-top: 20px;
 }
</style>
</head>

<body>
<div class="container">
 <h1>أهلاً بيك في مستشفى حلوان</h1>
 <h2> ${name} أهلاً</h2>

 <p>شكراً لاختيارك مستشفى حلوان. عشان تكمل تسجيلك، كل اللي عليك تضغط على الزر تحت علشان تأكد عنوان بريدك الإلكتروني.</p>

 <a href="${activationLink}">تأكيد البريد الإلكتروني</a>

 <p class="expiry">الرابط هينتهي بعد 120 ثانية!</p>
 <p>صحتك تهمنا</p>
</div>
</body>`;
  // 3- send activation mail for user
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "inkozeks@gmail.com",
      pass: "tvwxgyrfnzfvrxia",
    },
  });
  const info = await transporter.sendMail({
    from: '"مستشفي جامعة حلوان" <inkozeks@gmail.com>',
    to: recipientEmail,
    subject: "Verification Code!",
    html: emailBody,
  });
  console.log("Message sent: %s", info.messageId);
};

exports.activateEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid JWT token." });
      }

      // Update the user's activation status
      db.query("UPDATE students SET verified = 1 WHERE email = ?", [
        decoded.email,
      ]);

      return res.status(200).json({
        success: true,
        message: "Account activated successfully!",
      });
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
