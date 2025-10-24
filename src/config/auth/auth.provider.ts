import { auth } from './auth';

export const AUTH = 'AUTH';

export const AuthProvider = {
  provide: AUTH,
  useValue: auth,
};

export type AuthType = typeof auth;
