import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin as adminPlugin,
  openAPI,
  phoneNumber,
} from 'better-auth/plugins';
import { ac, admin, user } from './permissions';

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  plugins: [
    openAPI(),
    phoneNumber(),
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
    }),
  ],

  user: {
    deleteUser: {
      enabled: true,
    },

    additionalFields: {
      document: { type: 'string', nullable: true, unique: true },
    },
  },

  emailAndPassword: { enabled: true, autoSignIn: true },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  advanced: {
    cookiePrefix: 'syspay',
    database: {
      generateId: false,
    },
  },
});
