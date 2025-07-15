const prisma = require("../prismaClient");

const getFolderContents = async (userId, parentFolderId = null) => {
  const folderContents = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentFolderId: parentFolderId,
    },
    select: {
      name: true,
      id: true,
      createdAt: true,
    },
  });

  return folderContents;
};

const getUniqueFolderById = async (userId, folderId) => {
  if (folderId === null) {
    return null;
  }
  const folder = await prisma.folder.findUnique({
    where: {
      userId: userId,
      id: folderId,
    },
    select: {
      name: true,
      parentFolderId: true,
      id: true,
    },
  });

  return folder;
};

module.exports = { getFolderContents, getUniqueFolderById};
