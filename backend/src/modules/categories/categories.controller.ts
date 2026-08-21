import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { writeAudit } from '../../utils/audit';
import * as categoriesService from './categories.service';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  res.json(await categoriesService.listCategories(req.query.active !== 'true'));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'CREATE',
    module: 'categories',
    recordId: category.id,
    newData: category,
  });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const before = await categoriesService.getCategory(req.params.id);
  const category = await categoriesService.updateCategory(req.params.id, req.body);
  await writeAudit({
    userId: req.user!.id,
    action: 'UPDATE',
    module: 'categories',
    recordId: category.id,
    oldData: before,
    newData: category,
  });
  res.json(category);
});

export const setCategoryActive = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.setCategoryActive(req.params.id, req.body.active);
  await writeAudit({
    userId: req.user!.id,
    action: req.body.active ? 'ACTIVATE' : 'DEACTIVATE',
    module: 'categories',
    recordId: category.id,
  });
  res.json(category);
});
