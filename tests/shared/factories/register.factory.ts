export type RegisterRequestPayload = {
  name: string;
  email: string;
  username: string;
  cellphone: string;
  password: string;
};

export type RegisterResponseOverride = {
  name?: string;
  email?: string;
  username?: string;
  token?: string;
};

export function buildRegisterResponse(override: RegisterResponseOverride = {}) {
  return {
    data: {
      token: override.token ?? 'fake-jwt-token',
      user: {
        id: 'user-reg-1',
        name: override.name ?? 'QA Registro',
        username: override.username ?? 'qa.registro',
        email: override.email ?? 'qa.registro@sisinpos.com',
        cellphone: '3100000000',
        rol: 'ADMIN_ROLE',
        permissions: [],
        establishment: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    },
  };
}
