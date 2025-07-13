const { PrismaClient } = require("./generated/prisma");
const path = require("node:path");
const fs = require("node:fs");

const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findFirst({
    where: {
      email: "dominikstefancic8@hotmail.com",
    },
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  const userID = user.id.toString();
  const userRootFolderPath = path.join(__dirname, "public/uploads", userID);
  const newFolderName = "test 1 nested";
  const newFolderPath = path.join(userRootFolderPath, newFolderName);

  try {
    await prisma.$transaction(async (tx) => {
      // Ensure the physical path exists
      if (!fs.existsSync(newFolderPath)) {
        fs.mkdirSync(newFolderPath);
      }

      // Check if folder already exists in the DB for this user
      const existing = await tx.folder.findFirst({
        where: {
          name: newFolderName,
          userId: user.id,
          parentFolderId: 1, // adjust if using nested folders
        },
      });

      if (existing) {
        console.log("Folder already exists in DB:", existing);
        return;
      }

      // Only create if it doesn't exist
      const newFolder = await tx.folder.create({
        data: {
          name: newFolderName,
          userId: user.id,
          parentFolderId: 1,
        },
      });

      console.log("New folder created:", newFolder);
    });
  } catch (error) {
    console.error("Error during transaction:", error);
  }
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
