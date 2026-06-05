export type EstablishmentResponseOverride = {
  name?: string;
  type?: string;
  token?: string;
};

export function buildEstablishmentResponse(override: EstablishmentResponseOverride = {}) {
  return {
    data: {
      establishment: {
        id: 'est-onb-1',
        name: override.name ?? 'QA Establecimiento',
        type: override.type ?? 'TIENDA',
        is_nocturnal: false,
      },
      user: {
        id: 'user-reg-1',
        name: 'QA Registro',
        rol: 'ADMIN_ROLE',
        establishment: 'est-onb-1',
      },
      token: override.token ?? 'new-fake-jwt-token',
    },
  };
}
