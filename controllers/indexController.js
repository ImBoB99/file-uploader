const { getAllUsers } = require("../db/queries/userQueries");

const getRoot = async (req, res) => {
  const users = await getAllUsers();
  res.render("index", { users: users });
};

module.exports = { getRoot };
