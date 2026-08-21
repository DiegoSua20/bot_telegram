import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export interface AuthTokenPayload {
  sub: string;
  roleId: string;
  roleName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        username: string;
        email: string;
        roleId: string;
        roleName: string;
        permissions: string[];
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token no proporcionado');
    }
    const token = header.slice('Bearer '.length);
    let payload: AuthTokenPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    } catch {
      throw ApiError.unauthorized('Token invalido o expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user || !user.active) {
      throw ApiError.unauthorized('Usuario inactivo o inexistente');
    }

    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(...codes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const hasPermission = codes.some((code) => req.user!.permissions.includes(code));
    if (!hasPermission) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}
