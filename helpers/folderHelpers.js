const path = require("path");
const db = require("../db/queries/folderQueries");

const getFolderPathSegments = async (currentFolder, userId, getUniqueFolderByIdFn) => {
  if (currentFolder === null) return [];
  let segments = [];
  let current = currentFolder;
  while (current) {
    segments.unshift({ name: current.name, id: current.id });
    if (!current.parentFolderId) break;
    current = await getUniqueFolderByIdFn(userId, current.parentFolderId);
  }

  return segments;
};

const buildPathsFromSegments = (segments, userId) => {
  const names = segments.map((obj) => obj.name);
  const ids = segments.map((obj) => obj.id).join("/");

  const absolutePath = path.join(__dirname, "../public/uploads", userId.toString(), ...names);

  return { absolutePath, idPath: ids };
};

async function deleteFilesAndRemoveFromDisk(files) {
  for (const file of files) {
    const basePath = "../public/uploads";
    const filePath = file.path;
    const absolutePath = path.join(__dirname, basePath, filePath);
    // await fsp.unlink(absolutePath);
  }
}

async function deleteFolderAndRemoveFromDisk(userId, folderId) {
  const folder = await db.deleteFolderById(userId, folderId);
  const segments = await getFolderPathSegments(folder, userId, db.getUniqueFolderById);
  const { absolutePath } = buildPathsFromSegments(segments, userId);
  // await fsp.rm(absolutePath);
}

async function getAllNestedFolderIds(userId, rootFolderId) {
  const foldersToDelete = new Set();
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!foldersToDelete.has(id)) {
      foldersToDelete.add(id);
      const { folders: subfolders } = await db.getFolderContents(userId, id);
      subfolders.forEach((subfolder) => queue.push(subfolder.id));
    }
  }

  // We reverse so we delete the deepest folders first
  return [...foldersToDelete].reverse();
}




module.exports = { getFolderPathSegments, buildPathsFromSegments, deleteFilesAndRemoveFromDisk, deleteFolderAndRemoveFromDisk, getAllNestedFolderIds };
