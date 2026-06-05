// NOTA: 'type' es el texto visible en el mat-select del template Angular.
// Verificar contra el componente si los tests fallan en selectType().
export const establishmentData = {
  valid: {
    type: 'Tienda',
    name: 'QA Establecimiento',
  },
};

export function buildUniqueEstablishment() {
  const ts = Date.now();
  return {
    type: 'Tienda',
    name: `QA Establecimiento ${ts}`,
  };
}
