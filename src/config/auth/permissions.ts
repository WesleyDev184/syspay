import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  userAc,
} from 'better-auth/plugins/admin/access';

const statement = {
  ...defaultStatements,
  payment: ['create', 'list', 'listAll', 'update'],
} as const;

export const ac = createAccessControl(statement);

// pode fazer tudo
export const admin = ac.newRole({
  payment: ['create', 'list', 'listAll', 'update'],
  ...adminAc.statements,
});

// pode listar suas próprias ocorrências
export const user = ac.newRole({
  ...userAc.statements,
  payment: ['list'],
});
