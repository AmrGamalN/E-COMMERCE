require("dotenv").config();
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const userModel = require("../database/models/userModel");
const tokenActiveUser = require("../database/models/tokenActiveUser");
const ActiveUserModel = require("../database/models/activeUserModel");
const client = require("../database/redis_connection.js");
const MiddleWareError = require("../middleware/errorHandler");
const { handleError, handleSuccess } = require("../handleCheck/checkError");
const {
  genreateToken,
  genreateTokenConfirm,
} = require("../crypto/jsonwebtoken");
const { hashPassword } = require("../crypto/bcryptHashPassword");
const {
  verifcationEmail,
  verifcationPhone,
} = require("../modules/sendVerification.js");
const { uploadUserImage } = require("../modules/uploadFile");

// Redis caching
async function sendInfoToMiddleWare(userInfo) {
  try {
    const cacheKeyEmail = `email:${userInfo.email}`;
    const cacheKeyPhone = `phone:${userInfo.phone}`;
    const cachedUserDataEmail = await client.get(cacheKeyEmail);
    if (cachedUserDataEmail) {
      return JSON.parse(cachedUserDataEmail);
    }
    const cachedUserDataPhone = await client.get(cacheKeyPhone);
    if (cachedUserDataPhone) {
      return JSON.parse(cachedUserDataPhone);
    }

    const userInfoString = JSON.stringify(userInfo);
    await client.set(cacheKeyEmail, userInfoString, "EX", 3600);
    await client.set(cacheKeyPhone, userInfoString, "EX", 3600);
    return userInfo;
  } catch (err) {
    throw new Error("Failed to send data to middleware: " + err.message);
  }
}

async function interval(tokenRecord) {
  setInterval(async () => {
    try {
      if ((tokenRecord && tokenRecord._id) || tokenRecord.OTP) {
        await tokenActiveUser.findByIdAndDelete(tokenRecord._id);
      } else {
        console.log("Token not found.");
      }
    } catch (error) {
      console.error("Error deleting token record:", error);
    }
  }, 60000);
}

const valid = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleError(400, "VALIDATION FAILED", errors.array(), next);
  }
};

const register = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);

    const [existingRecord, user] = await Promise.all([
      tokenActiveUser.findOne({
        email: req.body.email,
        phone: req.body.phone,
      }),
      userModel.findOne({ email: req.body.email ,phone: req.body.phone }),
    ]);

    if (user) {
      return handleError(400, "EMAIL IS EXSIT", null, next);
    }
    const {
      fname,
      lname,
      age,
      password,
      confirmpassword,
      email,
      phone,
      gender,
    } = req.body;

    if (password !== confirmpassword) {
      return handleError(400, "PASSWORDS NOT MATCH", null, next);
    }

    const genOTP = Math.trunc(Math.random() * 1000000);
    const TokenConfirm = await genreateTokenConfirm({
      token: crypto.randomBytes(15).toString("hex"),
    });

    if (existingRecord) {
      return handleError(400, "PLEASE CONFIRM THE EMAIL", null, next);
    }

    const tokenRecord = await tokenActiveUser.create({
      email: email,
      token: TokenConfirm,
      OTP: genOTP,
      phone: phone,
    });

    const userInfo = {
      fname,
      lname,
      fullName: `${fname} ${lname}`,
      age,
      email,
      phone,
      gender,
      password: await hashPassword(password),
      confirmpassword: await hashPassword(password),
      token: TokenConfirm,
      OTP: genOTP,
    };
    await sendInfoToMiddleWare(userInfo);

    const linkVerification = `http://localhost:${process.env.PORT}/veirfyCodeFromEmail/${TokenConfirm}`;
    await verifcationEmail(linkVerification, email, TokenConfirm);

    // if (tokenRecord) {
      return handleSuccess(
        200,
        `VERIFICATION CODE IS SENT,PLEASE CHECK YOUR EMAIL ${email}`,
        null,
        next
      );
    // }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const login = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { password, email } = req.body;

    const user = await userModel.findOneAndUpdate(
      { email: email },
      { $set: { isActive: true } }
    );

    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }

    if (user.isBlocked == true) {
      return handleError(400, "USER IS BLOCK", null, next);
    }

    const compare = await bcrypt.compare(password, user.password);
    if (user && compare) {
      const token = await genreateToken({
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
      const exp = jwt.decode(token);

      await ActiveUserModel.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            user: user._id,
            email: user.email,
            role: user.role,
            exp: exp.exp,
            timeLogin: new Date(),
            timeLogout: new Date(exp.exp * 1000),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
      req.current = user;
      next();
      return handleSuccess(
        200,
        `LOGIN IS ${user.role} SUCCESSFUL`,
        token,
        next
      );
    } else {
      return handleError(404, "INCORRECT PASSWORD", null, next);
    }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const confirmByEmailAndPhone = async (req, next, cacheKey, token, OTP) => {
  try {
    valid(req, next);
    const cachedUserData = await client.get(cacheKey);
    const userInfo = JSON.parse(cachedUserData);
    if (!userInfo) {
      return handleError(404, "USER INFO NOT FOUND IN CACHE", null, next);
    }
    if (token !== userInfo.token && OTP != userInfo.OTP) {
      return handleError(404, "INVALED TOKEN", null, next);
    }

    if (Number(OTP) !== userInfo.OTP && token != userInfo.token) {
      return handleError(404, "INVALED OTP", null, next);
    }
    await Promise.all([
      userModel.findOneAndUpdate(
        {
          email: req.body.email,
        },
        {
          $set: { ...userInfo, confirmEmail: true },
        },
        { upsert: true, new: true }
      ),
      tokenActiveUser.deleteOne({
        email: userInfo.email,
        phone: userInfo.phone,
      }),
    ]);

    await client.del(cacheKey);
    return handleSuccess(200, "EMAIL IS VERIFIED", userInfo.email, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
};

const confrimByEmail = MiddleWareError(async (req, res, next) => {
  const cacheKey = `email:${req.body.email}`;
  confirmByEmailAndPhone(req, next, cacheKey, req.body.token, null);
});

const confrimByPhone = MiddleWareError(async (req, res, next) => {
  const cacheKey = `phone:${req.body.phone}`;
  confirmByEmailAndPhone(req, next, cacheKey, null, req.body.OTP);
});

const resendVeirfyCodeToEmail = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const cacheKey = `email:${req.body.email}`;
    const cachedUserData = await client.get(cacheKey);
    const userInfo = JSON.parse(cachedUserData);

    if (!userInfo) {
      return handleError(404, "USER INFO NOT FOUND IN CACHE", null, next);
    }

    const TokenConfirm = await genreateTokenConfirm({
      token: crypto.randomBytes(15).toString("hex"),
    });
    const tokenRecord = await tokenActiveUser.findOneAndUpdate(
      { email: req.body.email },
      { $set: { token: TokenConfirm } },
      { new: true }
    );

    interval(tokenRecord);
    const linkVerification = `http://localhost:${process.env.PORT}/veirfyCodeFromEmail/${TokenConfirm}`;
    await verifcationEmail(linkVerification, userInfo.email, TokenConfirm);

    if (!tokenRecord) {
      return handleError(400, "INVALIED TOKEN", null, next);
    }

    return handleSuccess(
      400,
      `RESEND TOKEN IS SUCCESSFUL ,PLEASE CHECK YOUR EMAIL ${userInfo.email}`,
      null,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const resendVeirfyCodeToPhone = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const cacheKey = `phone:${req.body.phone}`;
    const cachedUserData = await client.get(cacheKey);
    const userInfo = JSON.parse(cachedUserData);

    if (!userInfo) {
      return handleError(404, "USER INFO NOT FOUND IN CACHE", null, next);
    }
    await verifcationPhone(Phone, genOTP, req);
    const tokenRecord = await tokenActiveUser.findOne({
      email: req.body.phone,
    });

    interval(tokenRecord);
    if (!tokenRecord) {
      return handleError(400, "INVALIED TOKEN", null, next);
    }
    return handleSuccess(
      200,
      `SMS SEND TO PHONE ${req.body.phone}`,
      null,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getAllUser = MiddleWareError(async (req, res, next) => {
  try {
    const getUser = await userModel.find({}, { __v: false });
    if (!getUser) {
      return handleError(404, `NOT FOUND USER`, null, next);
    }
    return handleSuccess(200, "GET ALL USER SUCCESSFULLY", getUser, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getUserBYId = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { id } = req.body;
    const getUser = await userModel.findById({ _id: id });
    if (!getUser) {
      return handleError(404, `NOT FOUND USER`, null, next);
    }
    return handleSuccess(200, "GET SINGLE USER SUCCESSFULLY", getUser, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getUserBYPhone = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { phone } = req.body;
    const getUser = await userModel.findOne({ phone: phone });
    if (!getUser) {
      return handleError(404, `NOT FOUND USER`, null, next);
    }
    return handleSuccess(200, "GET SINGLE USER SUCCESSFULLY", getUser, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const searchByName = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { name } = req.body;
    const getUser = await userModel.findOne({ allName: name });

    if (!getUser) {
      return handleError(404, `NOT FOUND USER ${name}`, null, next);
    }
    return handleSuccess(200, `GET USER ${name} SUCCESSFUL`, getUser, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const logout = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const userId = req.currentUser._id;
    const [user] = await Promise.all([
      userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { isActive: false } }
      ),
      ActiveUserModel.findOneAndDelete({ user: userId }),
    ]);
    if (!user) {
      return handleError(404, "USER NOT FOUND", null, next);
    }
    return handleSuccess(
      200,
      `LOGOUT SUCCESSFUL AT ${new Date().toISOString()}`,
      user.isActive,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const changePassword = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { password, confirmpassword } = req.body;
    const userId = req.currentUser._id;
    const [hashPassword, hashConfirmpassword] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(confirmpassword, 10),
    ]);

    const user = await userModel.findOne({ _id: userId });

    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (comparePassword) {
      return handleError(400, "NEW PASSWORD ALREADY EXIST", null, next);
    }

    await userModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          password: hashPassword,
          confirmpassword: hashConfirmpassword,
        },
      }
    );

    return handleSuccess(200, "CHANGE PASSWORD SUCCESSFULLY", null, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteUser = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const user = await userModel.findByIdAndDelete({ _id: req.body.id });
    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }
    return handleSuccess(200, "USER ACCOUNT DELETE SUCCESSFULLY", null, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const forgetPasswordAndGetByEmail = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { email } = req.body;
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }

    const OTP = Math.trunc(Math.random() * 1000000);
    const resetToken = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const linkVerification = `http://localhost:3000/reset-password?token=${resetToken}`;
    await Promise.all([
      verifcationEmail(linkVerification, email, OTP),
      userModel.updateOne({ email }, { $set: { OTP: OTP } }),
    ]);

    return handleSuccess(
      200,
      "CHECK EMAIL OTP TO RESET YOUR PASSWORD",
      null,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const forgetPasswordAndGetByPhone = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const Phone = req.body.phone;
    const user = await userModel.findOne({ phone: Phone });
    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }
    const genOTP = Math.floor(Math.random() * 1000000);
    await verifcationPhone(Phone, genOTP, req);
    await userModel.updateOne({ phone: Phone }, { $set: { OTP: genOTP } });

    return handleSuccess(
      200,
      "CHECK YOUR PHONE OTP TO RESET YOUR PASSWORD",
      null,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const forgetPasswordAndCheckCodeFromPhone = MiddleWareError(
  async (req, res, next) => {
    try {
      valid(req, next);
      const { OTP, phone } = req.body;
      const user = await userModel.findOne({ phone: phone });
      if (!user) {
        return handleError(400, "NOT FOUND USER", null, next);
      }
      if (user.OTP != OTP) {
        return handleError(400, "INVALED OTP", null, next);
      }
      await userModel.updateOne({ phone: phone }, { $unset: { OTP: OTP } });
      return handleSuccess(
        200,
        "VAILED OTP NUMBER GO TO RESET PASSWORD",
        null,
        next
      );
    } catch (error) {
      return handleError(
        500,
        "INTERNAL SERVER ERROR",
        error.response ? error.response.data : error.message,
        next
      );
    }
  }
);

const forgetPasswordAndCheckCodeFromEmail = MiddleWareError(
  async (req, res, next) => {
    try {
      valid(req, next);
      const { OTP, email } = req.body;
      const user = await userModel.findOne({ email: email });
      if (!user) {
        return handleError(400, "NOT FOUND USER", null, next);
      }
      if (user.OTP != OTP) {
        return handleError(400, "INVALED OTP", null, next);
      }
      await userModel.updateOne({ email: email }, { $unset: { OTP: OTP } });
      return handleSuccess(200, "VAILED OTP GO TO RESET PASSWORD", null, next);
    } catch (error) {
      return handleError(
        500,
        "INTERNAL SERVER ERROR",
        error.response ? error.response.data : error.message,
        next
      );
    }
  }
);

const resetPassword = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { password, confirmpassword, email, phone } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const hashConfirmpassword = await bcrypt.hash(confirmpassword, 10);
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return handleError(400, "NOT FOUND USER", null, next);
    }
    const comparePassword = await bcrypt.compare(password, user.password);
    if (comparePassword) {
      return handleError(400, "NEW PASSWORD ALREADY EXIST", null, next);
    }
    await userModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          password: hashPassword,
          confirmpassword: hashConfirmpassword,
        },
      }
    );
    // can  login from here by generate token and respone or send in cookie
    // res.json({
    //   message: "Password reset successfully",
    //   token: newToken // send token to new user
    // });
    // const newToken = jwt.sign({ email: req.user.email, id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // or
    // res
    //   .cookie("authToken", newToken, {
    //     httpOnly: true,
    //     secure: true, // use with HTTPS
    //     maxAge: 3600000, // Token is valid for 1 hour.
    //   })
    //   .json({ message: "Password reset successfully" });

    return handleSuccess(200, "PASSWORD RESET SUCCESSFULLY", null, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const blockUser = MiddleWareError(async (req, res, next) => {
  try {
    const user = await userModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isBlocked: true, isActive: false } }
    );
    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }
    return handleSuccess(
      200,
      `USER ${user.email} IS BLOCK SUCCESSFULLY`,
      null,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const activeUser = MiddleWareError(async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return handleError(404, "NOT FOUND USER", null, next);
    }

    if (req.currentUser.role === "ADMIN") {
      await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { isBlocked: false, isActive: true } }
      );
      return handleSuccess(
        200,
        `EMAIL ${user.email} ALREADY ACTIVE`,
        null,
        next
      );
    } else {
      return handleError(
        404,
        `THE SETTING IS NOT CURRENTLY AVARIABLE FOR THIS ACCOUNT`,
        null,
        next
      );
    }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const sortByName = MiddleWareError(async (req, res, next) => {
  const sort = await userModel.find({}).sort({ fname: 1 });
  if (req.currentUser.role === "ADMIN") {
    return handleSuccess(200, `SORT IS SUCCESSFULLY`, sort, next);
  } else {
    return handleError(
      404,
      `THE SETTING IS NOT CURRENTLY AVARIABLE FOR THIS ACCOUNT`,
      null,
      next
    );
  }
});

const uploadImage = MiddleWareError(async (req, res, next) => {
  try {
    uploadUserImage(req, res, async (err) => {
      if (err) {
        return handleError(400, "UPLOAD IS FIALED", null, next);
      }
      const user = await userModel.findById(req.currentUser._id);

      if (!user) {
        return handleError(404, "User not found", null, next);
      }

      const timeDiff = Date.now() - user.profilePhoto.updated_at.getTime();

      if (timeDiff < 86400000 && user.profilePhoto.nameImage != undefined) {
        return handleSuccess(
          200,
          "You must wait 24 hours to upload a new image",
          null,
          next
        );
      }

      const data = req.files[0];
      if (!data) {
        return handleError(400, "No file uploaded", null, next);
      }
      const updatedUser = await userModel.findByIdAndUpdate(
        req.currentUser._id,
        {
          $set: {
            profilePhoto: {
              nameImage: data.filename,
              path: data.path,
              size: data.size,
              updated_at: Date.now(),
            },
          },
        },
        { new: true, upsert: true }
      );
      return handleSuccess(
        200,
        "IMAGE IS UPLOAD SUCCESSFULLY",
        updatedUser,
        next
      );
    });
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const numberUserActive = MiddleWareError(async (req, res, next) => {
  try {
    const [active, user] = await Promise.all([
      ActiveUserModel.find({}),
      userModel.find({}),
    ]);

    if (active) {
      return handleSuccess(
        200,
        ` NUMBER USER CONNECT ACTIVE IS ${
          active.length
        } NUMBER USER NOT ACTIVE IS ${user.length - active.length}`,
        [active.length, user.length - active.length],
        next
      );
    }
    return handleError(404, `NOT FOUND USER CONNECT`, null, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

module.exports = {
  register,
  login,
  confrimByEmail,
  resendVeirfyCodeToEmail,
  resendVeirfyCodeToPhone,
  confrimByPhone,
  getAllUser,
  getUserBYId,
  getUserBYPhone,
  searchByName,
  logout,
  blockUser,
  activeUser,
  deleteUser,
  changePassword,
  forgetPasswordAndGetByEmail,
  forgetPasswordAndGetByPhone,
  forgetPasswordAndCheckCodeFromPhone,
  forgetPasswordAndCheckCodeFromEmail,
  resetPassword,
  sortByName,
  uploadImage,
  numberUserActive,
  // updateInfo
};
