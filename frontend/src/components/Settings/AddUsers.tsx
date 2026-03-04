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

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
    ));
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
                      onClick={() => toggleStatus(user.id)}
                      className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm w-24 ${
                        user.status === 'Active' 
                        ? 'bg-red-500 text-white hover:bg-red-600' // Red for Deactivate
                        : 'bg-emerald-500 text-white hover:bg-emerald-600' // Green for Activate
                      }`}
                    >
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>

                  {/* EDIT/DELETE ACTIONS */}
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-500 hover:text-blue-700 p-2 transition-colors inline-block">
                      <Edit3 size={16} />
                    </button>
                    <button className="text-red-400 hover:text-red-600 p-2 transition-colors inline-block ml-2">
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
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password Again</label>
                    <input 
                      type="password" 
                      value={newUser.passwordConfirm}
                      onChange={(e) => setNewUser({...newUser, passwordConfirm: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="••••••••"
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
                  Back
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