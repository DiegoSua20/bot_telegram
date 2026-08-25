import { Router } from 'express';
import * as categoriesController from './categories.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { PERMISSIONS } from '../../utils/permissions';
import { createCategorySchema, setActiveSchema, updateCategorySchema } from './categories.validators';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', categoriesController.listCategories);
categoriesRouter.post(
  '/',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validate(createCategorySchema),
  categoriesController.createCategory,
);
categoriesRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validate(updateCategorySchema),
  categoriesController.updateCategory,
);
categoriesRouter.patch(
  '/:id/active',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validate(setActiveSchema),
  categoriesController.setCategoryActive,
);
