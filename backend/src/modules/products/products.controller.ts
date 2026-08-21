import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as productsService from './products.service';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productsService.listProducts(req.query as Record<string, string>));
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productsService.searchProducts(String(req.query.q ?? '')));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productsService.getProduct(req.params.id));
});

export const getProductByBarcode = asyncHandler(async (req: Request, res: Response) => {
  res.json(await productsService.getProductByBarcode(req.params.barcode));
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.createProduct(req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'CREATE',
    module: 'products',
    recordId: product.id,
    newData: product,
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const before = await productsService.getProduct(req.params.id);
  const product = await productsService.updateProduct(req.params.id, req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE',
    module: 'products',
    recordId: product.id,
    oldData: before,
    newData: product,
  });
  res.json(product);
});

export const setProductActive = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.setProductActive(req.params.id, req.body.active);
  await writeAudit({
    userId: req.user!.id,
    action: req.body.active ? 'ACTIVATE' : 'DEACTIVATE',
    module: 'products',
    recordId: product.id,
  });
  res.json(product);
});
