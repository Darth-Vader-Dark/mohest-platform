const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('--- USERS IN DATABASE ---');
    for (const u of users) {
      console.log(`User: ${u.email} (${u.firstName} ${u.lastName})`);
      console.log(`Department: ${u.department ? u.department.code : 'None'}`);
      console.log(`Roles:`);
      for (const ur of u.roles) {
        console.log(`  - Role: ${ur.role.name}`);
        console.log(`    Permissions:`);
        for (const rp of ur.role.permissions) {
          console.log(`      * ${rp.permission.key}`);
        }
      }
      console.log('-------------------------');
    }
  } catch (e) {
    console.error('Error checking users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
