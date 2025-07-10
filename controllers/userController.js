const bcrypt = require("bcrypt");
const db = require("../db/queries/userQueries");
const { validationResult } = require("express-validator");

const getRegister = (req, res) => {
  res.render("register");
};

const postRegister = async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);

  const errors = validationResult(req);
  console.log("Validation errors:", errors.array())
  if (!errors.isEmpty()) {
    // Handle errors - send back to client or re-render view
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.addUserToDb(username, email, hashedPassword);
  } catch (error) {
    console.error(error);
  }
  res.redirect("/register");
};

const getLogin = (req, res) => {
  res.render("login");
};

module.exports = { getRegister, postRegister, getLogin };
