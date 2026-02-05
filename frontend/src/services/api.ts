/**
 * MOCK API SERVICE
 * Satisfies ESLint by avoiding 'any'
 */

const SIMULATED_DELAY = 1000;

const api = {
  get: async (url: string) => {
    console.log(`[Mock GET]: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));

    if (url.includes('/users')) {
      return {
        data: [
          { id: 1, name: 'Bina', email: 'admin@luckyboba.com', role: 'superadmin', status: 'ACTIVE' },
          { id: 2, name: 'Staff Member', email: 'staff@luckyboba.com', role: 'manager', status: 'ACTIVE' },
        ],
      };
    }
    return { data: [] };
  },

  // Changed 'any' to 'Record<string, unknown>'
  post: async (url: string, body: Record<string, unknown>) => {
    console.log(`[Mock POST]: ${url}`, body);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));

    return {
      data: { ...body, id: Math.floor(Math.random() * 1000), status: 'OPEN' },
    };
  },

  // Changed 'any' to 'Record<string, unknown>'
  patch: async (url: string, body: Record<string, unknown>) => {
    console.log(`[Mock PATCH]: ${url}`, body);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    return { data: { ...body } };
  },

  delete: async (url: string) => {
    console.log(`[Mock DELETE]: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    return { data: { success: true } };
  },
};

export default api;