import { Prisma, PrismaClient } from '@prisma/client';

export type Tx = Prisma.TransactionClient | PrismaClient;
