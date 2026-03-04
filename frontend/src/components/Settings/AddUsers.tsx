import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { ArrowLeft, UserCog, Plus, Trash2, Edit3, X, Save, Shield } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  position: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

const AddUsers = ({ onBack }: { onBack: () => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: "admin_Luigi", name: "Luigi", position: "SYSTEM ADMIN", lastLogin: "2026-02-12 10:45 AM", status: "Active" },
    { id: 2, username: "cashier_01", name: "Leumar", position: "CASHIER", lastLogin: "2026-02-11 09:15 PM", status: "Active" },
  ]);

  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    passwordConfirm: '',
    position: 'CASHIER'
  });

  const positionOptions = [
    "CASHIER",
  ];

  const handleAddUser = () => {
    // Basic validation
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
    // Reset form
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
    setIsModalOpen(false);
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    setUsers(users.map(u => 
      u.id === editingUser.id ? editingUser : u
    ));
    
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const cancelEditUser = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.filter(u => u.id !== selectedUser.id));
    
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const cancelDeleteUser = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col font-sans overflow-hidden">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <UserCog size={24} className="text-[#3b2063]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">User Management</h1>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">System Access Control</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-[#10b981] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#059669] flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Add New User
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Username</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Position</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Last Login</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase">{user.username}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{user.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">
                    <span className="bg-zinc-100 px-2 py-1 rounded border border-zinc-200 text-[10px] font-black uppercase tracking-wider">
                      {user.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">{user.lastLogin}</td>
                  
                  {/* STATUS BUTTON COLUMN */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleStatusToggle(user)}
                      className={`relative group overflow-hidden px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-full text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-normal sm:tracking-widest transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 w-20 sm:w-24 md:w-28 min-w-[80px] sm:min-w-[90px] md:min-w-[100px] border-2 ${
                        user.status === 'Active' 
                        ? 'bg-emerald-50/50 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                        : 'bg-red-50/50 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.status === 'Active' ? 'bg-emerald-500 group-hover:bg-white' : 'bg-red-500 group-hover:bg-white'}`}></span>
                        {user.status === 'Active' ? 'Activate' : 'Deactivate'}
                      </span>
                    </button>
                  </td>

                  {/* EDIT/DELETE ACTIONS */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-blue-500 hover:text-blue-700 p-2 transition-colors inline-block"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-400 hover:text-red-600 p-2 transition-colors inline-block ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <button onClick={onBack} className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all shadow-sm">
              <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Create New Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              
              {/* SECTION 1: PROFILE DETAILS */}
              <div>
                <h3 className="text-[#1e40af] font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">
                  Profile Details
                </h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* SECTION 2: LOGIN DETAILS */}
              <div>
                <h3 className="text-[#1e40af] font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">
                  Login Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</label>
                    <input 
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                    <input 
                      type="password" 
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="•••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password Again</label>
                    <input 
                      type="password" 
                      value={newUser.passwordConfirm}
                      onChange={(e) => setNewUser({...newUser, passwordConfirm: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="•••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Position</label>
                    <div className="relative">
                      <select 
                        value={newUser.position}
                        onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      >
                        {positionOptions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Shield size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button 
                  onClick={handleAddUser}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Save size={14} /> Add Account
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Back to settings
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* === EDIT USER MODAL === */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit User Account</h2>
              <button onClick={cancelEditUser} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              
              {/* SECTION 1: PROFILE DETAILS */}
              <div>
                <h3 className="text-[#1e40af] font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">
                  Profile Details
                </h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* SECTION 2: LOGIN DETAILS */}
              <div>
                <h3 className="text-[#1e40af] font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">
                  Login Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username</label>
                    <input 
                      type="text" 
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Position</label>
                    <div className="relative">
                      <select 
                        value={editingUser.position}
                        onChange={(e) => setEditingUser({...editingUser, position: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      >
                        {positionOptions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Shield size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button 
                  onClick={handleUpdateUser}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Save size={14} /> Update Account
                </button>
                <button 
                  onClick={cancelEditUser}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* === CONFIRM STATUS TOGGLE MODAL === */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 flex justify-between items-center ${
              selectedUser.status === 'Active' ? 'bg-red-500' : 'bg-emerald-500'
            }`}>
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Confirm Status Change
              </h2>
              <button onClick={cancelStatusToggle} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  selectedUser.status === 'Active' ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  {selectedUser.status === 'Active' ? (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedUser.status === 'Active' ? 'Do you want to deactivate this user?' : 'Do you want to activate this user?'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedUser.status === 'Active' ? 'Are you sure you want to deactivate this user:' : 'Are you sure you want to activate this user:'}
                </p>
                <p className="text-sm font-black text-[#3b2063] uppercase">
                  {selectedUser.name}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmStatusToggle}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white ${
                    selectedUser.status === 'Active' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {selectedUser.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={cancelStatusToggle}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE USER MODAL === */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex justify-between items-center bg-red-500">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Confirm Delete User
              </h2>
              <button onClick={cancelDeleteUser} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-red-100">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0114 21h-4a2 2 0 01-1.995-1.858L5 7m5 4v6m0 0l3-3m-3 3l-3-3m3 3H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Do you want to delete this user?
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete this user:
                </p>
                <p className="text-sm font-black text-[#3b2063] uppercase">
                  {selectedUser.name}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmDeleteUser}
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white bg-red-500 hover:bg-red-600"
                >
                  Delete User
                </button>
                <button 
                  onClick={cancelDeleteUser}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
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

export default AddUsers;
