import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface CategoryData {
  id: number;
  name: string;
  description: string;
  menu_items_count: number; // Matches Laravel's withCount attribute
}

const CategoryList = () => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Categories with Cache Logic ---
  const fetchCategories = async () => {
    // Check if we have cached data in localStorage
    const cachedData = localStorage.getItem('luckyboba_categories_cache');
    if (cachedData) {
      setCategories(JSON.parse(cachedData));
      setLoading(false); // Stop loading immediately if cache exists
    }

    try {
      const response = await api.get('/categories');
      const freshData = response.data;
      
      // Update state and refresh the cache with fresh data
      setCategories(freshData);
      localStorage.setItem('luckyboba_categories_cache', JSON.stringify(freshData));
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. Add Category (and refresh cache) ---
  const handleAddCategory = async () => {
    if (!categoryName) return;
    
    try {
      const response = await api.post('/categories', {
        name: categoryName,
        description: description
      });
      
      const updatedCategories = [...categories, response.data];
      setCategories(updatedCategories);
      
      // Update cache so the new item is there next time
      localStorage.setItem('luckyboba_categories_cache', JSON.stringify(updatedCategories));
      
      setCategoryName('');
      setDescription('');
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category. Please check if the name already exists.");
    }
  };

  // --- 3. Delete Category (and refresh cache) ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);
      
      // Update cache after deletion
      localStorage.setItem('luckyboba_categories_cache', JSON.stringify(updatedCategories));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Cannot delete category. It might have active menu items linked to it.");
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        </div>

        {/* === ADD CATEGORY FORM SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.2em] text-center">Add Category</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <div className="w-full xl:w-1/3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10"
                />
              </div>
              <div className="pt-5">
                <button 
                  onClick={handleAddCategory}
                  className="w-full xl:w-auto bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add New
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === CATEGORY TABLE SECTION === */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Show</span>
              <select className="border border-zinc-300 rounded bg-white px-2 py-1 outline-none text-slate-700">
                <option>10</option><option>25</option><option>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <input type="text" className="border border-zinc-300 rounded-md bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-500 shadow-sm w-64 font-bold text-slate-700" />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading && categories.length === 0 ? (
              <div className="p-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs animate-pulse">Loading Categories...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Name</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Description</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Edit</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                      <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{cat.name}</td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-400">{cat.description || '-'}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{cat.menu_items_count}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {categories.length} Categories
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;