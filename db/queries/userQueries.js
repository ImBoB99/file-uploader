const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);

  return allUsers;
};

module.exports = {getAllUsers}
