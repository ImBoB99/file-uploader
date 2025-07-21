const path = require("path");

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


module.exports = { getFolderPathSegments, buildPathsFromSegments };
