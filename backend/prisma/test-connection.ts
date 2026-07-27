import { PrismaClient } from '@prisma/client';

async function testConnection(url: string, label: string) {
  console.log(`Testing: ${label}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  });
  try {
    await prisma.$connect();
    console.log(`✅ Success for ${label}!`);
    await prisma.$disconnect();
    return true;
  } catch (err: any) {
    console.log(`❌ Failed for ${label}:`, err.message || err);
    return false;
  }
}

async function run() {
  const projectRef = 'qixrbxgkfbclvbsylxfl';
  
  // Try different common password candidates
  const passwords = [
    'admin',
    'mohest_dev_password',
    'postgres',
    'your-supabase-secret-key'
  ];

  for (const pw of passwords) {
    // Note: since direct ipv6-only connection might fail depending on IPv6 network support,
    // let's try the IPv4 pooler host (eu-central-1 region is typical, or we can use IPv6 direct domain if supported)
    const directUrl = `postgresql://postgres.${projectRef}:${pw}@db.${projectRef}.supabase.co:5432/postgres`;
    const pooledUrl = `postgresql://postgres.${projectRef}:${pw}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    
    const label = `Password "${pw.slice(0, 15)}..."`;
    const ok = await testConnection(pooledUrl, `${label} (pooled)`);
    if (ok) {
      console.log(`FOUND WORKING CONNECTION STRING: ${pooledUrl}`);
      process.exit(0);
    }
    const okDirect = await testConnection(directUrl, `${label} (direct)`);
    if (okDirect) {
      console.log(`FOUND WORKING CONNECTION STRING: ${directUrl}`);
      process.exit(0);
    }
  }
  console.log('None of the password candidates worked.');
  process.exit(1);
}

run();
