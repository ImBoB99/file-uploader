const { getAllUsers } = require("../db/queries/userQueries");

const getRoot = async (req, res) => {
  res.render("index");
};

module.exports = { getRoot };
