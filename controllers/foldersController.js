const prisma = require("../db/prismaClient")

const getFoldersRoot = async (req, res) => {
  console.log("Getting root folder")

  console.log(req.user)

  const userId = req.user.id;

  const rootFolderContents = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentFolderId: null,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    }
  })

  console.log(rootFolderContents)
  res.render("folders", {foldersData: rootFolderContents})
}

module.exports = { getFoldersRoot }