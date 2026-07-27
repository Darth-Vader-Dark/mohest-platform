const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function testAuth() {
  const users = await prisma.user.findMany();
  console.log('Testing passwords for users:');
  for (const user of users) {
    console.log(`User: ${user.email}`);
    console.log(`Hash in DB: "${user.passwordHash}"`);
    for (const testPass of ['Admin12345', 'password', 'Password123', 'admin', '123456']) {
      try {
        const match = await argon2.verify(user.passwordHash, testPass);
        if (match) {
          console.log(`  SUCCESS! Password for ${user.email} is: "${testPass}"`);
        }
      } catch (err) {
        console.error(`  Error verifying ${user.email}:`, err.message);
      }
    }
  }
  await prisma.$disconnect();
}

testAuth();
