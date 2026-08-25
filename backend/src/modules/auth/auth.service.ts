import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { writeAudit } from '../../utils/audit';
import { sendMail } from '../../utils/mailer';

function signToken(userId: string, roleId: string, roleName: string) {
  return jwt.sign({ sub: userId, roleId, roleName }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function login(username: string, password: string, ip?: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user) {
    throw ApiError.unauthorized('Usuario o contrasena incorrectos');
  }
  if (!user.active) {
    throw ApiError.forbidden('El usuario esta desactivado. Contacte al administrador');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Usuario o contrasena incorrectos');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({ userId: user.id, action: 'LOGIN', module: 'auth', recordId: user.id, ip });

  const token = signToken(user.id, user.roleId, user.role.name);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    },
  };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return; // No revelar si el correo existe
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: token, resetPasswordExpires: expires },
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Recuperacion de contrasena',
    html: `<p>Hola ${user.name},</p><p>Para restablecer tu contrasena haz clic en el siguiente enlace (valido por 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  await writeAudit({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', module: 'auth', recordId: user.id });
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } },
  });
  if (!user) {
    throw ApiError.badRequest('El token es invalido o ha expirado');
  }
  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
  });
  await writeAudit({ userId: user.id, action: 'PASSWORD_RESET', module: 'auth', recordId: user.id });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.badRequest('La contrasena actual es incorrecta');
  }
  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await writeAudit({ userId, action: 'PASSWORD_CHANGED', module: 'auth', recordId: userId });
}
