import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit3, X, Save, Shield } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  position: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

const UserManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: "admin_Luigi", name: "Luigi", position: "SYSTEM ADMIN", lastLogin: "2026-02-12 10:45 AM", status: "Active" },
    { id: 2, username: "cashier_01", name: "Leumar", position: "CASHIER", lastLogin: "2026-02-11 09:15 PM", status: "Active" },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    passwordConfirm: '',
    position: 'CASHIER'
  });

  const positionOptions = [
    "SYSTEM ADMIN",
    "SUPERVISOR", 
    "CASHIER",
    "WAITER",
    "DISCOUNT",
    "INVENTORY CLERK",
    "ORDERS",
    "VOID"
  ];

  const handleAddUser = () => {
    if (!newUser.username || !newUser.name || !newUser.password) return;
    if (newUser.password !== newUser.passwordConfirm) {
      alert("Passwords do not match!");
      return;
    }
    
    const entry: User = {
      id: Date.now(),
      username: newUser.username,
      name: newUser.name,
      position: newUser.position,
      lastLogin: "Never",
      status: "Active"
    };

    setUsers([...users, entry]);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
    setIsModalOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      username: user.username,
      password: '',
      passwordConfirm: '',
      position: user.position
    });
    setIsModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    const updatedUsers = users.map(u => 
      u.id === editingUser.id 
        ? { 
            ...u, 
            name: newUser.name,
            username: newUser.username,
            position: newUser.position,
          }
        : u
    );

    setUsers(updatedUsers);
    setEditingUser(null);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleStatusToggle = (user: User) => {
    setSelectedUser(user);
    setIsConfirmModalOpen(true);
  };

  const confirmStatusToggle = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } 
        : u
    ));
    
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const cancelStatusToggle = () => {
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
            <Users size={20} className="text-[#3b2063]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-black text-[#3b2063] uppercase tracking-wider">User Management</h1>
            <p className="text-zinc-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider mt-1">System Access Control</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#3b2063] text-white rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-widest hover:bg-[#291645] flex items-center gap-2 shadow-lg transition-all active:scale-95 min-w-32 sm:min-w-36"
        >
          <Plus size={12} strokeWidth={3} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Username</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Position</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Last Login</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-[#3b2063] uppercase">{user.username}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-700">{user.name}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-500">
                    <span className="bg-zinc-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-zinc-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                      {user.position}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-zinc-400 text-center">{user.lastLogin}</td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                    <button 
                      onClick={() => handleStatusToggle(user)}
                      className={`relative group overflow-hidden px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-full text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-normal sm:tracking-widest transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 w-20 sm:w-24 md:w-28 min-w-20 sm:min-w-24 md:min-w-28 border-2 ${
                        user.status === 'Active' 
                        ? 'bg-red-50/50 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white'
                        : 'bg-emerald-50/50 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.status === 'Active' ? 'bg-red-500 group-hover:bg-white' : 'bg-emerald-500 group-hover:bg-white'}`}></span>
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-blue-500 hover:text-blue-700 p-1 sm:p-2 transition-colors inline-block"
                      title="Edit User"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-600 p-1 sm:p-2 transition-colors inline-block ml-1 sm:ml-2"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[#3b2063] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                {editingUser ? 'Edit User' : 'Create New Account'}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-[#1e40af] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4 border-b border-zinc-100 pb-2">
                  Profile Details
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-[#1e40af] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4 border-b border-zinc-100 pb-2">
                  Login Details
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</label>
                    <input 
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="Enter username"
                    />
                  </div>

                  {!editingUser && (
                    <>
                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password Again</label>
                        <input 
                          type="password" 
                          value={newUser.passwordConfirm}
                          onChange={(e) => setNewUser({...newUser, passwordConfirm: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  )}

                  {editingUser && (
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Password (optional)</label>
                      <input 
                        type="password" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                  )}

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Position</label>
                    <div className="relative">
                      <select 
                        value={newUser.position}
                        onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      >
                        {positionOptions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Shield size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-zinc-100">
                <button 
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="flex-1 bg-[#3b2063] hover:bg-[#291645] text-white py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 min-w-28 sm:min-w-32"
                >
                  <Save size={14} /> {editingUser ? 'Update User' : 'Add Account'}
                </button>
                <button 
                  onClick={closeModal}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-[0.2em] transition-all min-w-20 sm:min-w-28"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center ${
              selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              <h2 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
                Confirm Status Change
              </h2>
              <button onClick={cancelStatusToggle} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  selectedUser.status === 'Active' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {selectedUser.status === 'Active' ? (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedUser.status === 'Active' ? 'Activate User?' : 'Deactivate User?'}
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to {selectedUser.status === 'Active' ? 'activate' : 'deactivate'} the user:
                </p>
                <p className="text-sm font-black text-[#3b2063] uppercase">
                  {selectedUser.name} ({selectedUser.username})
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <button 
                  onClick={confirmStatusToggle}
                  className={`flex-1 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white ${
                    selectedUser.status === 'Active' 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {selectedUser.status === 'Active' ? 'ACTIVATE' : 'DEACTIVATE'}
                </button>
                <button 
                  onClick={cancelStatusToggle}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
