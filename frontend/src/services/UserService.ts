import type { User, CreateUserData, UpdateUserData } from '../types/user';

const SIMULATED_DELAY = 800;

const mockUsers: User[] = [
  { id: 1, name: 'Bina', email: 'admin@luckyboba.com', role: 'superadmin', status: 'ACTIVE', branch: 'Main Branch' },
  { id: 2, name: 'Staff Member', email: 'staff@luckyboba.com', role: 'manager', status: 'ACTIVE', branch: 'Mall Branch' },
];

const UserService = {
  async getAllUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    return [...mockUsers];
  },

  async createUser(data: CreateUserData): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    const { password: _pass, ...rest } = data;
    const newUser: User = {
      ...rest,
      id: Math.floor(Math.random() * 10000),
      status: data.status ?? 'ACTIVE',
      branch: data.branch,
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    const { password: _pass, ...rest } = data;
    const updatedUser: User = { ...mockUsers[index], ...rest };
    mockUsers[index] = updatedUser;
    return updatedUser;
  },

  async deleteUser(id: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    mockUsers.splice(index, 1);
  },
};

export default UserService;
export type { User, CreateUserData, UpdateUserData };
