const { body } = require("express-validator");

const validSign = () => {
  return [
    body("fname")
      .notEmpty()
      .withMessage("LAST NAME IS REQUIRED")
      .isString()
      .withMessage("LAST NAME MUST BE A STRING")
      .isLength({ min: 3, max: 10 })
      .withMessage("LAST NAME MUST BE BETWEEN 3 AND 10 CHARACTERS")
      .isAlpha("en-US")
      .withMessage("LAST NAME MUST CONTAIN ONLY LETTERS")
      .isLowercase()
      .withMessage("LAST NAME MUST BE IN LOWERCASE"),
    body("lname")
      .notEmpty()
      .withMessage("LAST NAME IS REQUIRED")
      .isString()
      .withMessage("LAST NAME MUST BE A STRING")
      .isLength({ min: 3, max: 10 })
      .withMessage("LAST NAME MUST BE BETWEEN 3 AND 10 CHARACTERS")
      .isAlpha("en-US")
      .withMessage("LAST NAME MUST CONTAIN ONLY LETTERS")
      .isLowercase()
      .withMessage("LAST NAME MUST BE IN LOWERCASE"),
    body("age")
      .notEmpty()
      .withMessage("AGE IS REQUIRED")
      .isDate({ format: "YYYY-MM-DD" })
      .withMessage("AGE MUST BE A VALID DATE"),
    body("password")
      .notEmpty()
      .withMessage("PASSWORD IS REQUIRED")
      .isLength({ min: 10, max: 15 })
      .withMessage("PASSWORD MUST BE BETWEEN 10 AND 15 CHARACTERS")
      .isAlphanumeric("en-US", { ignore: "!@#$%^&*" })
      .withMessage(
        "PASSWORD MUST CONTAIN ONLY ENGLISH LETTERS AND NUMBERS, EXCLUDING SPECIAL CHARACTERS"
      )
      .isStrongPassword()
      .withMessage(
        "PASSWORD MUST INCLUDE AT LEAST ONE SPECIAL CHARACTER, ONE UPPERCASE LETTER, AND HAVE A MINIMUM LENGTH OF 8"
      ),

    body("confirmpassword")
      .notEmpty()
      .withMessage("PASSWORD IS REQUIRED")
      .isLength({ min: 10, max: 15 })
      .withMessage("PASSWORD MUST BE BETWEEN 10 AND 15 CHARACTERS")
      .isAlphanumeric("en-US", { ignore: "!@#$%^&*" })
      .withMessage(
        "PASSWORD MUST CONTAIN ONLY ENGLISH LETTERS AND NUMBERS, EXCLUDING SPECIAL CHARACTERS"
      )
      .isStrongPassword()
      .withMessage(
        "PASSWORD MUST INCLUDE AT LEAST ONE SPECIAL CHARACTER, ONE UPPERCASE LETTER, AND HAVE A MINIMUM LENGTH OF 8"
      )
      .custom((value, { req }) => {
        if (req.body.password !== value) {
          throw new Error("PASSWORDS DO NOT MATCH");
        }
        return true;
      }),
    body("email")
      .notEmpty()
      .withMessage("EMAIL IS REQUIRED")
      .isEmail()
      .withMessage("MUST BE A VALID EMAIL ADDRESS")
      .matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.com)$/)
      .withMessage("EMAIL MUST BE FROM GMAIL, HOTMAIL, OR YAHOO"),
    body("phone")
      .notEmpty()
      .withMessage("PHONE NUMBER IS REQUIRED")
      .isMobilePhone("ar-EG")
      .withMessage("INVALID PHONE NUMBER")
      .isNumeric()
      .withMessage("PHONE NUMBER MUST CONTAIN ONLY NUMBERS")
      .isLength({ min: 11, max: 11 })
      .withMessage("PHONE NUMBER MUST BE EXACTLY 11 DIGITS"),

    body("gender")
      .notEmpty()
      .withMessage("GENDER IS REQUIRED")
      .isString()
      .withMessage("GENDER MUST BE A STRING")
      .isAlpha("en-US")
      .withMessage("GENDER MUST CONTAIN ONLY LETTERS")
      .isLowercase()
      .withMessage("GENDER MUST BE IN LOWERCASE")
      .matches(/^(male|female)$/)
      .withMessage("GENDER MUST BE EITHER 'MALE' OR 'FEMALE'"),
  ];
};

const validLogin = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("EMAIL IS REQUIRED")
      .isEmail()
      .withMessage("MUST BE A VALID EMAIL ADDRESS")
      .matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.com)$/)
      .withMessage("EMAIL MUST BE FROM GMAIL, HOTMAIL, OR YAHOO"),
    body("password").notEmpty().withMessage("IS REQUIRED"),
  ];
};

const validEmail = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("EMAIL IS REQUIRED")
      .isEmail()
      .withMessage("MUST BE A VALID EMAIL ADDRESS")
      .matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|yahoo\.com)$/)
      .withMessage("EMAIL MUST BE FROM GMAIL, HOTMAIL, OR YAHOO"),
  ];
};

const validPassword = () => {
  return [
    body("password")
      .notEmpty()
      .withMessage("PASSWORD IS REQUIRED")
      .isLength({ min: 10, max: 15 })
      .withMessage("PASSWORD MUST BE BETWEEN 10 AND 15 CHARACTERS")
      .isAlphanumeric("en-US", { ignore: "!@#$%^&*" })
      .withMessage(
        "PASSWORD MUST CONTAIN ONLY ENGLISH LETTERS AND NUMBERS, EXCLUDING SPECIAL CHARACTERS"
      )
      .isStrongPassword()
      .withMessage(
        "PASSWORD MUST INCLUDE AT LEAST ONE SPECIAL CHARACTER, ONE UPPERCASE LETTER, AND HAVE A MINIMUM LENGTH OF 8"
      ),

    body("confirmpassword")
      .notEmpty()
      .withMessage("PASSWORD IS REQUIRED")
      .isLength({ min: 10, max: 15 })
      .withMessage("PASSWORD MUST BE BETWEEN 10 AND 15 CHARACTERS")
      .isAlphanumeric("en-US", { ignore: "!@#$%^&*" })
      .withMessage(
        "PASSWORD MUST CONTAIN ONLY ENGLISH LETTERS AND NUMBERS, EXCLUDING SPECIAL CHARACTERS"
      )
      .isStrongPassword()
      .withMessage(
        "PASSWORD MUST INCLUDE AT LEAST ONE SPECIAL CHARACTER, ONE UPPERCASE LETTER, AND HAVE A MINIMUM LENGTH OF 8"
      )
      .custom((value, { req }) => {
        if (req.body.password !== value) {
          throw new Error("PASSWORDS DO NOT MATCH");
        }
        return true;
      }),
  ];
};

const validId = () => {
  return [
    body("id")
      .notEmpty()
      .withMessage("PASSWORD IS REQUIRED")
      .isMongoId()
      .withMessage("INVALID ID"),
  ];
};

const validPhone = () => {
  return [
    body("phone")
      .notEmpty()
      .withMessage("PHONE NUMBER IS REQUIRED")
      .isMobilePhone("ar-EG")
      .withMessage("INVALID PHONE NUMBER")
      .isNumeric()
      .withMessage("PHONE NUMBER MUST CONTAIN ONLY NUMBERS")
      .isLength({ min: 11, max: 11 })
      .withMessage("PHONE NUMBER MUST BE EXACTLY 11 DIGITS"),
  ];
};

const validName = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("LAST NAME IS REQUIRED")
      .isString()
      .withMessage("LAST NAME MUST BE A STRING")
      .isLength({ min: 3, max: 10 })
      .withMessage("LAST NAME MUST BE BETWEEN 3 AND 10 CHARACTERS")
      .isLowercase()
      .withMessage("LAST NAME MUST BE IN LOWERCASE"),
  ];
};

const validOTP = () => {
  return [
    body("OTP")
      .notEmpty()
      .withMessage("THE OTP FIELD IS REQUIRED.")
      .isNumeric()
      .withMessage("THE OTP MUST CONTAIN ONLY NUMBERS.")
      .isLength({ min: 6, max: 6 })
      .withMessage("THE OTP MUST BE EXACTLY 6 DIGITS LONG."),
  ];
};
const validToken = () => {
  return [
    body("token")
      .notEmpty()
      .withMessage("THE OTP FIELD IS REQUIRED.")
      .isString()
      .withMessage("THE OTP MUST CONTAIN ONLY CHARACTERS.")
      .isLength({ min: 226, max: 226 })
      .withMessage("THE OTP MUST BE EXACTLY 296 DIGITS LONG."),
  ];
};

module.exports = {
  validSign,
  validEmail,
  validPassword,
  validId,
  validPhone,
  validName,
  validEmail,
  validLogin,
  validPassword,
  validId,
  validPhone,
  validName,
  validOTP,
  validToken,
};
