const prisma = require("../db/prismaClient");
const path = require("node:path");
const fs = require("node:fs");
const db = require("../db/queries/folderQueries");
const { getFolderPathSegments, buildPathsFromSegments } = require("../helpers/folderHelpers");

const getFolderRoot = async (req, res) => {
  console.log("Getting root folder");

  const userId = Number(req.user.id);

  const rootFolderContents = await db.getFolderContents(userId, null);

  res.render("folders", { foldersData: rootFolderContents, currentFolder: "root", path: "" });
};

const getFolderById = async (req, res, next) => {
  console.log("Getting folder by id");

  const userId = Number(req.user.id);
  const params = req.params.folderId;
  const folderId = Number(params[params.length - 1]);

  console.log("Target folder ID:", folderId);

  const currentFolder = await db.getUniqueFolderById(userId, folderId);

  if (!currentFolder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error);
  }

  const folderContents = await db.getFolderContents(userId, currentFolder.id);
  const segments = await getFolderPathSegments(currentFolder, userId, db.getUniqueFolderById);
  const { idPath } = buildPathsFromSegments(segments, userId);

  console.log(idPath);

  res.render("folders", {
    foldersData: folderContents,
    currentFolder: currentFolder,
    path: idPath,
  });
};

const postNewFolder = async (req, res, next) => {
  console.log("Make new folder");
  const userId = Number(req.user.id);
  let { folderName, folderId } = req.body;

  console.log(userId, folderName, folderId);

  folderId = folderId === "root" ? null : Number(folderId);
  const currentFolder = await db.getUniqueFolderById(userId, folderId);

  if (folderId !== null && !currentFolder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error);
  }

  const segments = await getFolderPathSegments(currentFolder, userId, db.getUniqueFolderById);
  const { absolutePath, idPath } = buildPathsFromSegments(segments, userId);

  const folderPath = path.join(absolutePath, folderName);

  console.log(folderPath);
  try {
    await prisma.$transaction(async (tx) => {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      const existing = await tx.folder.findFirst({
        where: {
          name: folderName,
          userId: userId,
          parentFolderId: folderId,
        },
      });

      if (existing) {
        console.log("Folder already exists in DB:", existing);
        return;
      }

      const newFolder = await tx.folder.create({
        data: {
          name: folderName,
          userId: userId,
          parentFolderId: folderId,
        },
      });

      console.log("New folder created:", newFolder);
    });
  } catch (error) {
    console.error("Error during transaction:", error);
  }

  console.log(absolutePath);
  res.redirect(idPath ? `/folders/${idPath}` : "/folders");
};

module.exports = { getFolderRoot, getFolderById, postNewFolder };
