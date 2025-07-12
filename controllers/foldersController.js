const getFoldersRoot = (req, res) => {
  console.log("Getting root folder")
  res.render("folders")
}

module.exports = { getFoldersRoot }