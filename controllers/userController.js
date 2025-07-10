const bcrypt = require("bcrypt");
const db = require("../db/queries/userQueries")

const getRegister = (req, res) => {
  res.render("register")
}

const postRegister = async (req, res) => {
  const {username, email, password} = req.body;
  console.log(username, email, password);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.addUserToDb(username, email, hashedPassword);
  } catch (error) {
    console.error(error)
  }
  res.redirect("/login")
}

const getLogin = (req, res) => {
  res.render("login")
}

module.exports = {getRegister, postRegister, getLogin}