const bcrypt = require("bcrypt");
const db = require("../db/queries/userQueries");
const { validationResult } = require("express-validator");
const fs = require("node:fs");
const path = require("node:path");
const prisma = require("../db/prismaClient");

const projectRoot = path.resolve(__dirname, "../"); // adjust levels as needed
const uploadsPath = path.join(projectRoot, "public/uploads");

const getRegister = (req, res) => {
  res.render("register");
};

const postRegister = async (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);

  const errors = validationResult(req);
  console.log("Validation errors:", errors.array());
  if (!errors.isEmpty()) {
    // Handle errors - send back to client or re-render view
    return res.status(400).json({ errors: errors.array() });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await db.addUserToDb(username, email, hashedPassword, tx);

      const userID = user.id.toString();
      const userFolderPath = path.join(uploadsPath, userID);

      if (!fs.existsSync(userFolderPath)) {
        fs.mkdirSync(userFolderPath);
      }

      console.log(user);
      // transaction commits here if no errors
    });
  } catch (error) {
    console.error(error);
  }
  res.redirect("/register");
};

const getLogin = (req, res) => {
  res.render("login");
};

const getUpload = (req, res) => {
  res.render("upload");
};

const postUpload = (req, res) => {
  console.log("Posting upload...");
  console.log(req.file, req.body);
  res.redirect("/upload");
};

module.exports = { getRegister, postRegister, getLogin, getUpload, postUpload };
