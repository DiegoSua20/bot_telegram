import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { Prisma, PrismaClient } from '@prisma/client';

type Tx = Prisma.TransactionClient | PrismaClient;

export async function listSeries() {
  return prisma.series.findMany({ orderBy: { name: 'asc' } });
}

export async function createSeries(name: string) {
  return prisma.series.create({ data: { name: name.toUpperCase() } });
}

export async function setSeriesActive(id: string, active: boolean) {
  const series = await prisma.series.findUnique({ where: { id } });
  if (!series) throw ApiError.notFound('Serie no encontrada');
  return prisma.series.update({ where: { id }, data: { active } });
}

/**
 * Genera atomicamente el siguiente numero correlativo dentro de la
 * transaccion recibida, evitando duplicados bajo concurrencia.
 */
export async function reserveNextNumber(tx: Tx, seriesId: string) {
  const series = await tx.series.update({
    where: { id: seriesId },
    data: { currentNumber: { increment: 1 } },
  });
  return series.currentNumber;
}

export async function getDefaultActiveSeries() {
  const series = await prisma.series.findFirst({ where: { active: true }, orderBy: { name: 'asc' } });
  if (!series) throw ApiError.badRequest('No hay ninguna serie activa configurada. Configure una en Series.');
  return series;
}
