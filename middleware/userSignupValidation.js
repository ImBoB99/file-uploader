const { body } = require("express-validator");
const { alphaErr, lengthErr, emailErr } = require("../helpers/errorValidationMessages");
const { getUserByEmail } = require("../db/queries/userQueries");

const validateUsername = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required.")
    .isAlpha("en-US")
    .withMessage(alphaErr)
    .isLength({ min: 2, max: 20 })
    .withMessage(lengthErr),
];

const validateEmail = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)
    .withMessage(emailErr)
    .custom(async (value) => {
      const existingUser = await getUserByEmail(value);
      if (existingUser) {
        throw new Error("A user with this e-mail already exists.");
      }

      return true;
    }),
];

const validatePassword = [
  body("password").trim().notEmpty().withMessage("Password is required."),
  // can enforce additional password constraints
];

const validateConfirmPassword = [
  body("confirmPassword").custom((value, { req }) => {

    const passwordsMatch = value === req.body.password;
    if (!passwordsMatch) {
      throw new Error("Passwords do not match")
    }

    return true;
  }),
];

const signupValidation = [
  ...validateUsername,
  ...validateEmail,
  ...validatePassword,
  ...validateConfirmPassword
];

module.exports = {
  signupValidation,
  // or export individual ones if needed too
};