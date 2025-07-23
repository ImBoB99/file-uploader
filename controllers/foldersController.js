const prisma = require("../db/prismaClient");
const path = require("node:path");
const fs = require("node:fs");
const fsp = fs.promises;
const db = require("../db/queries/folderQueries");
const {
  getFolderPathSegments,
  buildPathsFromSegments,
  deleteFilesAndRemoveFromDisk,
  deleteFolderAndRemoveFromDisk,
  getAllNestedFolderIds,
} = require("../helpers/folderHelpers");

const getFolderRoot = async (req, res) => {
  const userId = Number(req.user.id);

  const rootFolderContents = await db.getFolderContents(userId, null);

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

  const filePath = path.join(__dirname, "../public/uploads", file.path);
  console.log(filePath);
  res.download(filePath, file.filename);
};

const postDeleteFile = async (req, res, next) => {
  const userId = Number(req.user.id);
  const fileId = Number(req.params.fileId);

  const file = await db.getFileDetailsById(userId, fileId);
  console.log(file);
  if (!file) return res.status(404).send("File not found");

  try {
    const deletedFile = await prisma.$transaction(async (tx) => {
      return await tx.file.delete({
        where: {
          userId: userId,
          id: fileId,
        },
      });
    });

    const filePath = path.join(__dirname, "../public/uploads", deletedFile.path);
    await fsp.rm(filePath);
    console.log("File Removed");
  } catch (error) {
    return next(error);
  }

  // redirect to referring page or root folder
  res.redirect(req.get("Referer") || "/folders");
};

// Unrefactored
// const postDeleteFolder = async (req, res, next) => {
//   const userId = Number(req.user.id);
//   const folderId = Number(req.params.folderId);

//   try {
//     console.log(`User Id: ${userId}, Folder Id to be deleted: ${folderId}`);
//     const { folders: subfolders, files } = await db.getFolderContents(userId, folderId);
//     console.log(`Subfolders from DB:`, subfolders);
//     console.log(`Files in folder:`, files);

//     // CASE 1 Folder has no subfolders or files
//     if (subfolders.length === 0 && files.length === 0) {
//       //TODO: replace findUnique with delete
//       const deletedFolder = await db.deleteFolderById(userId, folderId);

//       const segments = await getFolderPathSegments(deletedFolder, userId, db.getUniqueFolderById);
//       const { absolutePath } = buildPathsFromSegments(segments, userId);
//       //TODO: await fsp.rm(absolutePath);

//       console.log("Deleted folder: ", deletedFolder);
//       console.log(`Folder ${folderId} path on disc is ${absolutePath}`);
//     }

//     //CASE 2 Folder has no subfolders but has files
//     if (subfolders.length === 0 && files.length > 0) {
//       //TODO: replace findMany with deleteMany
//       const deletedFiles = await db.deleteFilesInFolder(userId, folderId);

//       for (const file of deletedFiles) {
//         const basePath = "../public/uploads";
//         const filePath = file.path;
//         const absolutePath = path.join(__dirname, basePath, filePath);
//         console.log(`Deleting file at absPath: ${absolutePath}`);
//         //TODO: await fsp.unlink(absolutePath); // eventually
//       }

//       const deletedFolder = await db.deleteFolderById(userId, folderId);

//       const segments = await getFolderPathSegments(deletedFolder, userId, db.getUniqueFolderById);
//       const { absolutePath } = buildPathsFromSegments(segments, userId);
//       //TODO: await fsp.rm(absolutePath);

//       console.log("Deleted folder: ", deletedFolder);
//       console.log(`Folder ${folderId} path on disc is ${absolutePath}`);
//     }

//     // CASE 3 Folder has subfolders but no files
//     if (subfolders.length > 0 && files.length === 0) {
//       const foldersToDelete = new Set();
//       const queue = [folderId];

//       while (queue.length > 0) {
//         const id = queue.shift();

//         if (!foldersToDelete.has(id)) {
//           console.log(id);
//           foldersToDelete.add(id);

//           const { folders: subfolders } = await db.getFolderContents(userId, id);

//           subfolders.forEach((subfolder) => {
//             if (!foldersToDelete.has(subfolder.id)) {
//               queue.push(subfolder.id);
//             }
//           });
//         }
//       }

//       console.log(`Folder ids for deletion: `, foldersToDelete);

//       const reversedForDeletion = [...foldersToDelete].reverse();

//       console.log(`Reversed folder ids for deletion: `, reversedForDeletion);
//       for (const id of reversedForDeletion) {
//         //TODO: replace findUnique with delete
//         const folder = await db.deleteFolderById(userId, id);

//         const segments = await getFolderPathSegments(folder, userId, db.getUniqueFolderById);
//         const { absolutePath } = buildPathsFromSegments(segments, userId);
//         console.log(`Folder path for deletion:`, absolutePath);
//         //TODO: await fsp.rm(absolutePath);
//       }
//     }

//     // CASE 4 Folder has subfolders and files
//     if (subfolders.length > 0 && files.length > 0) {
//       const foldersToDelete = new Set();
//       const queue = [folderId];

//       while (queue.length > 0) {
//         const id = queue.shift();

//         if (!foldersToDelete.has(id)) {
//           console.log(id);
//           foldersToDelete.add(id);

//           const { folders: subfolders } = await db.getFolderContents(userId, id);

//           subfolders.forEach((subfolder) => {
//             if (!foldersToDelete.has(subfolder.id)) {
//               queue.push(subfolder.id);
//             }
//           });
//         }
//       }

//       console.log(`Folder ids for deletion: `, foldersToDelete);

//       const reversedForDeletion = [...foldersToDelete].reverse();

//       console.log(`Reversed folder ids for deletion: `, reversedForDeletion);
//       for (const id of reversedForDeletion) {
//         //TODO: replace findUnique with delete
//         const folder = await db.deleteFolderById(userId, id);

//         //TODO: replace findMany with deleteMany
//         const currentFolderFiles = await db.deleteFilesInFolder(userId, id);

//         for (const file of currentFolderFiles) {
//           const basePath = "../public/uploads";
//           const filePath = file.path;
//           const absolutePath = path.join(__dirname, basePath, filePath);

//           console.log(`Deleting ${folder.name}'s file at absPath: ${absolutePath}`);
//           //TODO: await fsp.rm(absolutePath);
//         }

//         const segments = await getFolderPathSegments(folder, userId, db.getUniqueFolderById);
//         const { absolutePath } = buildPathsFromSegments(segments, userId);
//         console.log(`Folder path for deletion:`, absolutePath);
//         console.log("Current folder's files: ", currentFolderFiles);
//         //TODO: await fsp.rm(absolutePath);
//       }
//     }

//     res.redirect(req.get("Referer") || "/folders");
//   } catch (error) {
//     console.error("Failed to delete folder:", error);
//     return next(error);
//   }
// };

const postDeleteFolder = async (req, res, next) => {
  const userId = Number(req.user.id);
  const folderId = Number(req.params.folderId);

  try {
    const { folders: subfolders, files } = await db.getFolderContents(userId, folderId);
    // CASE 1 Folder has no subfolders or files
    if (subfolders.length === 0 && files.length === 0) {
      await deleteFolderAndRemoveFromDisk(userId, folderId);
    }

    //CASE 2 Folder has no subfolders but has files
    if (subfolders.length === 0 && files.length > 0) {
      const deletedFiles = await db.deleteFilesInFolder(userId, folderId);
      await deleteFilesAndRemoveFromDisk(deletedFiles);
      await deleteFolderAndRemoveFromDisk(userId, folderId);
    }

    // CASE 3 Folder has subfolders but no files
    if (subfolders.length > 0 && files.length === 0) {
      const folderIds = await getAllNestedFolderIds(userId, folderId);

      for (const id of folderIds) {
        await deleteFolderAndRemoveFromDisk(userId, id);
      }
    }

    // CASE 4 Folder has subfolders and files
    if (subfolders.length > 0 && files.length > 0) {
      const folderIds = await getAllNestedFolderIds(userId, folderId);
      for (const id of folderIds) {
        const currentFolderFiles = await db.deleteFilesInFolder(userId, id);
        await deleteFilesAndRemoveFromDisk(currentFolderFiles);
        await deleteFolderAndRemoveFromDisk(userId, id);
      }
    }

    res.redirect(req.get("Referer") || "/folders");
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return next(error);
  }
};

module.exports = {
  getFolderRoot,
  getFolderById,
  postNewFolder,
  postNewFile,
  getFileById,
  downloadFileById,
  postDeleteFile,
  postDeleteFolder,
};
