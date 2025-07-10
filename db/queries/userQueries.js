const { PrismaClient } = require("../../generated/prisma");

const prisma = new PrismaClient();

const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);

  return allUsers;
};

const addUserToDb = async (username, email, password) => {
  const user = await prisma.user.create({
    data: {
      username: username,
      email: email,
      password: password,
    }
  })

  return user;
}

module.exports = {getAllUsers, addUserToDb}
