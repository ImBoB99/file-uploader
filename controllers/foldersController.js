const prisma = require("../db/prismaClient")

const getFoldersRoot = async (req, res) => {
  console.log("Getting root folder")

  console.log(req.user)

  const userId = Number(req.user.id);

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

const getFolderById = async (req, res) => {
  console.log("Getting folder by id")

  const userId = Number(req.user.id);
  const folderId = Number(req.params.folderId);

  const folder = await prisma.folder.findUnique({
    where: {
      userId: userId,
      id: folderId,
    }
  })

  if (!folder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error)
  }

  const folderContents = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentFolderId: folderId
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    }
  })

  console.log(folderContents)
  res.render("folders", {foldersData: folderContents, currentFolder: folder})
}

module.exports = { getFoldersRoot, getFolderById }