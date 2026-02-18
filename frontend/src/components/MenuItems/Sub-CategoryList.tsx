"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2, Plus, Edit3, Trash2 } from 'lucide-react';
import { getCache, setCache } from '../../utils/cache';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  itemCount: number;
}

interface MainCategory {
  id: number;
  name: string;
}

interface SubCategoryCache {
  subCategories: SubCategoryData[];
  mainCategories: MainCategory[];
}

const SubCategoryList = () => {
  const { showToast } = useToast();

  // ✅ Read cache once safely at the top
  const [subCategories, setSubCategories] = useState<SubCategoryData[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.subCategories ?? [];
  });
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.mainCategories ?? [];
  });
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | string>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.mainCategories?.[0]?.id ?? '';
  });
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(() => getCache<SubCategoryCache>('sub-categories') === null);
  const [subCategoryName, setSubCategoryName] = useState(''); 

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    if (!forceRefresh && cached) {
      setSubCategories(cached.subCategories);
      setMainCategories(cached.mainCategories);
      return;
    }

    setIsFetching(true);
    try {
      const [subRes, mainRes] = await Promise.all([
        api.get('/sub-categories'),
        api.get('/categories')
      ]);

      const toCache: SubCategoryCache = {
        subCategories: subRes.data,
        mainCategories: mainRes.data
      };
      setCache('sub-categories', toCache);

      setSubCategories(subRes.data);
      setMainCategories(mainRes.data);
      if (mainRes.data.length > 0 && !selectedMainCategoryId) {
        setSelectedMainCategoryId(mainRes.data[0].id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToast("Failed to sync with database", "error");
    } finally {
      setIsFetching(false);
    }
  }, [showToast, selectedMainCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubCategory = async () => {
    if (!subCategoryName || !selectedMainCategoryId) {
      showToast("Please enter a name and select a category", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/sub-categories', {
        name: subCategoryName,
        category_id: selectedMainCategoryId
      });
      const updated = [response.data, ...subCategories];
      setSubCategories(updated);
      // ✅ Update cache in place
      const existing = getCache<SubCategoryCache>('sub-categories');
      if (existing) setCache('sub-categories', { ...existing, subCategories: updated });
      setSubCategoryName('');
      showToast("Sub-category added!", "success");
    } catch (error) {
      console.error("Add error:", error);
      showToast("Error saving to database", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this sub-category?")) return;
    try {
      await api.delete(`/sub-categories/${id}`);
      const updated = subCategories.filter(s => s.id !== id);
      setSubCategories(updated);
      // ✅ Update cache in place
      const existing = getCache<SubCategoryCache>('sub-categories');
      if (existing) setCache('sub-categories', { ...existing, subCategories: updated });
      showToast("Deleted successfully", "success");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans text-slate-700">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6 relative">
          {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-[#1e40af]" /></div>}
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.2em] text-center">Add Sub Category</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col xl:flex-row xl:items-end gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sub Category Name</label>
                <input type="text" value={subCategoryName} onChange={(e) => setSubCategoryName(e.target.value)} className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10" placeholder="e.g. UL, UM, SM" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Main Category</label>
                <select value={selectedMainCategoryId} onChange={(e) => setSelectedMainCategoryId(Number(e.target.value))} className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10 cursor-pointer">
                  {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <button onClick={handleAddSubCategory} disabled={loading} className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                <Plus size={16} /> Add New
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col relative">
          {isFetching && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-[#1e40af]" size={32} /></div>}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Sub Category Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Main Category</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Edit</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subCategories.length > 0 ? (
                  subCategories.map((sub, index) => (
                    <tr key={sub.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                      <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{sub.name}</td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">{sub.mainCategory}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{sub.itemCount}</td>
                      <td className="px-6 py-4 text-center"><button className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg active:scale-95"><Edit3 size={14} /></button></td>
                      <td className="px-6 py-4 text-center"><button onClick={() => handleDelete(sub.id)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg active:scale-95"><Trash2 size={14} /></button></td>
                    </tr>
                  ))
                ) : (
                  !isFetching && <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-bold text-xs uppercase">No sub-categories found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubCategoryList;