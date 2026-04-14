import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Building2, Mail, Phone, MoreVertical, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface Franchise {
    id: number;
    name: string;
    contact_email: string;
    contact_number: string;
    status: 'active' | 'inactive';
    branches_count: number;
}

const FranchisesTab: React.FC = () => {
    const [franchises, setFranchises] = useState<Franchise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchFranchises();
    }, []);

    const fetchFranchises = async () => {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('lucky_boba_token');
            const res = await fetch('/api/franchises', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setFranchises(data);
            }
        } catch (error) {
            console.error("Failed to fetch franchises", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = franchises.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a0f2e] flex items-center gap-2">
                        <Layers className="text-[#3b2063]" size={24} />
                        Franchise Management
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Group and manage your brand's franchises and their branches.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#3b2063] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2d184d] transition-colors shadow-lg shadow-purple-900/10">
                    <Plus size={18} />
                    NEW FRANCHISE
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search franchises..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-100 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                                <th className="px-6 py-4">Franchise Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Branches</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-sm">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-zinc-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">No franchises found.</td>
                                </tr>
                            ) : filtered.map(f => (
                                <tr key={f.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#3b2063]">
                                                <Building2 size={20} />
                                            </div>
                                            <span className="font-bold text-[#1a0f2e]">{f.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-zinc-600">
                                                <Mail size={12} className="text-zinc-400" />
                                                <span className="text-xs">{f.contact_email || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-600">
                                                <Phone size={12} className="text-zinc-400" />
                                                <span className="text-xs">{f.contact_number || '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                                            {f.branches_count} Branches
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                                            f.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                                        }`}>
                                            <CheckCircle2 size={10} />
                                            {f.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FranchisesTab;
