const prisma = require("../db/prismaClient");

const getFoldersRoot = async (req, res) => {
  console.log("Getting root folder");

  console.log(req.user);

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
    },
  });

  console.log(rootFolderContents);
  res.render("folders", { foldersData: rootFolderContents, pathArray: [] });
};

const getFolderById = async (req, res, next) => {
  console.log("Getting folder by id");

  const userId = Number(req.user.id);

  const pathArray = req.params.folderId;

  const folderId = Number(pathArray[pathArray.length - 1]);

  console.log("Current path:", pathArray);
  console.log("Target folder ID:", folderId);

  const folder = await prisma.folder.findUnique({
    where: {
      userId: userId,
      id: folderId,
    },
  });

  if (!folder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error);
  }

  const folderContents = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentFolderId: folderId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  console.log(folderContents);
  console.log(folder);
  console.log(pathArray.join("/"))
  res.render("folders", { foldersData: folderContents, currentFolder: folder, pathArray: pathArray });
};

const postNewFolder = async (req, res) => {
  console.log("Creating new folder...");

  const userId = Number(req.user.id);
  if (!user) {
    console.error("User not found");
    return;
  }

  let parentFolderId = Number(req.body.id) || null;

  console.log(parentFolderId)

  res.redirect("/");
};

module.exports = { getFoldersRoot, getFolderById };
