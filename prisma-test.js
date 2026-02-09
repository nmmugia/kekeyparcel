const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const prisma = new PrismaClient({});
    const result = await prisma.$queryRawUnsafe('SELECT 1');
    console.log('TLS OK:', result);
    await prisma.$disconnect();
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
