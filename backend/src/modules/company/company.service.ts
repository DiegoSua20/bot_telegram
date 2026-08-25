import { prisma } from '../../config/prisma';

const DEFAULT_CONFIG = {
  tradeName: 'Mi Empresa',
  legalName: 'Mi Empresa, Sociedad Anonima',
  taxId: 'CF',
  address: 'Ciudad de Guatemala, Guatemala',
  phone: '',
  email: '',
  logoUrl: null as string | null,
  currency: 'GTQ',
  currencySymbol: 'Q',
  defaultTaxRate: 12,
  country: 'Guatemala',
  invoiceFormat: 'A4',
  allowOversell: false,
  requireOpenCashRegister: false,
};

export async function getConfig() {
  let config = await prisma.companyConfig.findFirst();
  if (!config) {
    config = await prisma.companyConfig.create({ data: DEFAULT_CONFIG });
  }
  return config;
}

export async function updateConfig(data: Partial<typeof DEFAULT_CONFIG>) {
  const config = await getConfig();
  return prisma.companyConfig.update({ where: { id: config.id }, data });
}

export async function updateLogo(logoUrl: string) {
  const config = await getConfig();
  return prisma.companyConfig.update({ where: { id: config.id }, data: { logoUrl } });
}
