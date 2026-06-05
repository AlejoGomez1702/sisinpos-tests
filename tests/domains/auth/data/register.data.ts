export const registerUsers = {
  valid: {
    name: 'QA Registro Usuario',
    email: 'qa.registro@sisinpos.com',
    username: 'qa.registro',
    cellphone: '3100000000',
    password: 'Password123',
    repeatPassword: 'Password123',
  },
};

export function buildUniqueUser() {
  const ts = Date.now();
  return {
    name: `QA Test ${ts}`,
    // email local part = "qatest{ts}", que coincide con el auto-fill del username
    email: `qatest${ts}@sisinpos.com`,
    username: `qatest${ts}`,
    cellphone: '3100000000',
    password: 'Password123!',
    repeatPassword: 'Password123!',
  };
}
