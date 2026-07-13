/**
 * cleanup-demo-data.ts
 * Deletes all demo seed content from the public-site tables.
 * Run once: npx ts-node prisma/cleanup-demo-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing demo institutions...');
  const { count: instCount } = await prisma.institution.deleteMany();
  console.log(`  Deleted ${instCount} institutions.`);

  console.log('Removing demo scholarships...');
  const { count: schCount } = await prisma.scholarship.deleteMany();
  console.log(`  Deleted ${schCount} scholarships.`);

  console.log('Removing demo news articles...');
  const { count: newsCount } = await prisma.newsArticle.deleteMany();
  console.log(`  Deleted ${newsCount} news articles.`);

  console.log('Removing demo leaders...');
  const { count: leadersCount } = await prisma.leader.deleteMany();
  console.log(`  Deleted ${leadersCount} leaders.`);

  console.log('Done. All demo data removed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
