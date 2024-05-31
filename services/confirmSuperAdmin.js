const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

sendConfirmationMail = async (email, name) => {
  // 1- Sign JWT token with user information and set expiration to 50 seconds
  const confirmationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "60s",
  });

  //2- prepare confirmation mail for user
  const recipientEmail = email;
  const confirmationLink = `http://localhost:7000/api/v1/auth/confirmEmail?token=${confirmationToken}`;
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
    background-color: #f5f5f5;
}

h1 {
    color: #fff;
    margin-bottom: 20px;
}

p {
    margin: 20px 0;
    font-size: 18px;
    color: #333;
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

</style>
</head>

<body>
    <div class="container">
        <h1>أهلاً بيك في مستشفى جامعة حلوان</h1>
        <h2>${name} أهلاً</h2>
        <p>شكراً لاختيارك مستشفى حلوان. عشان تكمل تسجيلك، كل اللي عليك تضغط على الزر تحت علشان تأكد عنوان بريدك الإلكتروني.</p>
        <a href="${confirmationLink}">تأكيد البريد الإلكتروني</a>
        <p class="expiry">الرابط هينتهي بعد 120 ثانية!</p>
        <p>صحتك تهمنا</p>
    </div>
`;
  // 3- send confirmation mail for user
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
    subject: "Confirmation Email!",
    html: emailBody,
    attachments: {
      filename: "",
    },
  });
  console.log("Message sent: %s", info.messageId);
};

confirmEmail = (req, res) => {
  const { token } = req.query;
  console.log("hellow from confirmation email");
  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid JWT token." });
    }
    // Update the user's confirmation status
    db.query("UPDATE superadmin SET confirmed = 1 WHERE email = ?", [
      decoded.email,
    ]);
    return res.status(202).json({
      success: true,
      message: "Account Confirmed successfully!",
    });
  });
};

module.exports = {
  sendConfirmationMail,
  confirmEmail,
};
