const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();
  let allUsers = await prisma.user.findMany();
  console.log(allUsers);

  const newUser = await prisma.user.create({
    data: {
      username: 'Alice',
      email: 'alice@prisma.io',
      password: 'hashedpassword',
    }
  })
  console.log(newUser)

  allUsers = await prisma.user.findMany();
  console.log(allUsers);
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
