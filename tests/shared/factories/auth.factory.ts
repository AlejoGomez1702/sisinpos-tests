export type LoginResponseOverride = {
  establishment?: Record<string, unknown> | undefined;
};

export function buildLoginResponse(override: LoginResponseOverride = {}) {
  const withEstablishment = override.establishment !== undefined;

  return {
    data: {
      token: 'fake-jwt-token',
      user: {
        id: 'user-1',
        name: 'QA User',
        username: 'qa.user',
        email: 'qa@sisinpos.com',
        cellphone: '3000000000',
        rol: 'ADMIN_ROLE',
        permissions: ['clients.canRead'],
        establishment: withEstablishment
          ? override.establishment
          : {
              id: 'est-1',
              name: 'Mi Negocio',
              type: 'STORE',
              updated_at: '2026-01-01T00:00:00.000Z',
            },
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    },
  };
}
