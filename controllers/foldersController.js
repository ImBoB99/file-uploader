const prisma = require("../db/prismaClient");
const path = require("node:path");
const fs = require("node:fs");
const db = require("../db/queries/folderQueries");
const { getFolderPathSegments, buildPathsFromSegments } = require("../helpers/folderHelpers");

const getFolderRoot = async (req, res) => {
  const userId = Number(req.user.id);

  const rootFolderContents = await db.getFolderContents(userId, null);
  console.log(rootFolderContents);

  res.render("folders", { foldersData: rootFolderContents, currentFolder: "root", path: "" });
};

const getFolderById = async (req, res, next) => {
  const userId = Number(req.user.id);
  const params = req.params.folderId;
  const folderId = Number(params[params.length - 1]);

  const currentFolder = await db.getUniqueFolderById(userId, folderId);

  if (!currentFolder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error);
  }

  const folderContents = await db.getFolderContents(userId, currentFolder.id);
  const segments = await getFolderPathSegments(currentFolder, userId, db.getUniqueFolderById);
  const { idPath } = buildPathsFromSegments(segments, userId);

  res.render("folders", {
    foldersData: folderContents,
    currentFolder: currentFolder,
    path: idPath,
  });
};

const postNewFolder = async (req, res, next) => {
  const userId = Number(req.user.id);
  let { folderName, folderId } = req.body;

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
    });
  } catch (error) {
    console.error("Error during transaction:", error);
  }

  res.redirect(idPath ? `/folders/${idPath}` : "/folders");
};

const postNewFile = async (req, res, next) => {
  console.log("Uploading...");
  const userId = Number(req.user.id);
  const file = req.file;

  if (!file) return res.status(400).send("No file uploaded");

  let { folderId } = req.body;

  folderId = folderId === "root" ? null : Number(folderId);
  const currentFolder = await db.getUniqueFolderById(userId, folderId);

  if (folderId !== null && !currentFolder) {
    const error = new Error("Folder not found");
    error.status = 404;
    return next(error);
  }

  const segments = await getFolderPathSegments(currentFolder, userId, db.getUniqueFolderById);
  const { absolutePath, idPath } = buildPathsFromSegments(segments, userId);

  console.log(userId, file);

  const fileName = Date.now() + "-" + file.originalname;
  const filePath = path.join(absolutePath, fileName); // eg. /home/user/.../uploads/15
  const relativePath = "/" + absolutePath.split("uploads/")[1]; // → "/15"

  console.log(`File Name: ${fileName}`);
  console.log(`File Path: ${filePath}`);
  console.log(`File Relative Path: ${relativePath}`);

  try {
    await prisma.$transaction(async (tx) => {
      try {
        fs.writeFileSync(filePath, file.buffer);
      } catch (error) {
        console.log(error);
      }

      const dbFile = await tx.file.create({
        data: {
          filename: file.originalname,
          userId: userId,
          folderId: folderId || null,
          path: relativePath + "/" + fileName,
          mimetype: file.mimetype,
          size: file.size,
        },
      });

      console.log(dbFile);
    });

    res.redirect(idPath ? `/folders/${idPath}` : "/folders");
  } catch (error) {
    console.error("Upload failed: ", error);
    return next(error);
  }
};

const getFileById = async (req, res, next) => {
  const userId = Number(req.user.id);
  const fileId = Number(req.params.fileId);

  try {
    const file = await db.getFileDetailsById(userId, fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const downloadFileById = async (req, res, next) => {
  const userId = Number(req.user.id);
  const fileId = Number(req.params.fileId);

  const file = await db.getFileDetailsById(userId, fileId);
  if (!file) return res.status(404).send("File not found");

  console.log(file)

  // You probably stored the file buffer in memory or saved it on disk — adjust this accordingly
  const filePath = path.join(__dirname, "../public/uploads", file.path); // update path if needed
  console.log(filePath)
  res.download(filePath, file.filename);
};


module.exports = { getFolderRoot, getFolderById, postNewFolder, postNewFile, getFileById, downloadFileById };
