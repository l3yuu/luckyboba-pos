import { useState, useEffect, useCallback } from 'react';
import type { User, CreateUserData } from '../types/user';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initial Load
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock network delay
      
      setUsers([
        { id: 1, name: 'Bina', email: 'admin@luckyboba.com', role: 'superadmin', status: 'ACTIVE' },
        { id: 2, name: 'Staff User', role: 'manager', email: 'staff@luckyboba.com', status: 'ACTIVE' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    // We create a self-invoking async function or just call the async loadUsers
    // This tells React: "I'm starting a process that will finish later"
    const init = async () => {
      await loadUsers();
    };
    
    init();
  }, [loadUsers]);

  // Create User Action
  const createUser = async (data: CreateUserData) => {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const newUser: User = {
      ...data,
      id: Math.floor(Math.random() * 1000),
      status: 'OPEN',
    };

    setUsers((prev) => [...prev, newUser]);
    setIsUpdating(false);
    return newUser;
  };

  return { users, isLoading, isUpdating, createUser };
};