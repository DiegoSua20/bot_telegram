import { Router } from 'express';
import * as productsController from './products.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createProductSchema, listProductsSchema, setActiveSchema, updateProductSchema } from './products.validators';

export const productsRouter = Router();

productsRouter.use(requireAuth, requirePermission(PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_MANAGE));

productsRouter.get('/', validate(listProductsSchema), productsController.listProducts);
productsRouter.get('/search', productsController.searchProducts);
productsRouter.get('/barcode/:barcode', productsController.getProductByBarcode);
productsRouter.get('/:id', productsController.getProduct);
productsRouter.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCTS_MANAGE),
  validate(createProductSchema),
  productsController.createProduct,
);
productsRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS_MANAGE),
  validate(updateProductSchema),
  productsController.updateProduct,
);
productsRouter.patch(
  '/:id/active',
  requirePermission(PERMISSIONS.PRODUCTS_MANAGE),
  validate(setActiveSchema),
  productsController.setProductActive,
);
