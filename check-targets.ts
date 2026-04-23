import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.targetAllocation.findMany().then(console.log).finally(() => prisma.$disconnect());
