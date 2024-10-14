const nodemailer = require("nodemailer");
const https = require("follow-redirects").https;
const { handleError } = require("../handleCheck/checkError");

const verifcationEmail = async (linkVerification, email, addToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: process.env.HOSTNODEMAILER,
      port: 587,
      secure: false,
      auth: {
        user: process.env.USERNODEMAILER,
        pass: process.env.PASSNODEMAILER,
      },
    });

    const emailOptin = {
      from: process.env.USERNODEMAILER,
      to: email,
      subject: "Activate your account OR reset Password ",
      html: `
    <div>
        <a href="${linkVerification}">Click here to [ Reset Or Activate ] your account [${addToken}]</a>
    </div>
  `,
    };

    try {
      await transporter.sendMail(emailOptin);
      console.log("Email is Send Successfully");
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR IN VERFICATION EMAIL",
      error.response ? error.response.data : error.message,
      next
    );
  }
};

const verifcationPhone = async (phone, OTP) => {
  try {
    const options = {
      method: "POST",
      hostname: process.env.HOSTINFOBIP,
      path: process.env.PATHINFOBIP,
      headers: {
        Authorization: process.env.AUTPHONEAPI,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      maxRedirects: 20,
    };

    const request = https.request(options, function (res) {
      const chunks = [];
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
      });
      res.on("error", function (error) {
        console.error(error);
      });
    });

    const postData = JSON.stringify({
      messages: [
        {
          destinations: [{ to: "2" + phone }],
          from: "ServiceSMS",
          text: `Your OTP is: ${OTP}`,
        },
      ],
    });
    request.write(postData);
    request.end();
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR IN VERFICATION PHONE",
      error.response ? error.response.data : error.message,
      next
    );
  }
};

module.exports = { verifcationEmail, verifcationPhone };
