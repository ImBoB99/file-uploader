const prisma = require("../prismaClient");

const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);

  return allUsers;
};

const addUserToDb = async (username, email, password, prismaClient = prisma) => {
  const user = await prismaClient.user.create({
    data: {
      username: username,
      email: email,
      password: password,
    },
  });

  return user;
};

const getUserByEmail = async (email) => {
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  return user;
};

const getUserById = async (id) => {
  const user = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });

  return user;
};

module.exports = { getAllUsers, addUserToDb, getUserByEmail, getUserById };
