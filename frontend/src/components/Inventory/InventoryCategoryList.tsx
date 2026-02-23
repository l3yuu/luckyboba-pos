import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  itemCount: number;
}

const InventoryCategoryList = () => {
  const { showToast } = useToast();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(null);

  // Initial data based on your reference image
  const [categories, setCategories] = useState<InventoryCategory[]>([
    { id: 1, name: "INVT", description: "", itemCount: 156 },
  ]);

  const handleAddCategory = () => {
    if (!categoryName) {
      showToast('Please enter a category name', 'error');
      return;
    }
    const newCategory: InventoryCategory = {
      id: Date.now(),
      name: categoryName,
      description: description,
      itemCount: 0
    };
    setCategories([...categories, newCategory]);
    setCategoryName('');
    setDescription('');
    showToast(`Category "${categoryName}" has been added successfully`, 'success');
  };

  const handleEditClick = (category: InventoryCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDescription(category.description);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !categoryName) return;
    
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: categoryName, description: description }
        : cat
    ));
    
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
    showToast(`Category "${categoryName}" has been updated successfully`, 'success');
  };

  const handleDeleteClick = (category: InventoryCategory) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
    showToast(`Category "${categoryToDelete.name}" has been deleted`, 'error');
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* === HEADER SECTION === */}
        <div className="mb-2">
          
        </div>

        {/* === ADD CATEGORY FORM SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em] text-center">
              Add Category
            </h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="w-32 text-sm font-bold text-slate-600">Category Name</label>
              <input 
                type="text" 
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 rounded border border-zinc-300 outline-none focus:border-blue-500 transition-all shadow-sm h-10 font-bold text-slate-700"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <label className="w-32 text-sm font-bold text-slate-600 mt-2">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 max-w-2xl h-32 px-4 py-2 rounded border border-zinc-300 outline-none focus:border-blue-500 transition-all shadow-sm resize-none font-bold text-slate-700"
              />
            </div>
            <div className="pl-0 md:pl-36">
              <button 
                onClick={handleAddCategory}
                className="bg-[#3b2063] hover:bg-[#2a1745] text-white px-8 py-3 rounded font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* === CATEGORY TABLE SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Description</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Items</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{cat.name}</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-400 text-center">{cat.description || '-'}</td>
                    <td className="px-4 py-4 text-xs font-black text-slate-700 text-center">{cat.itemCount}</td>
                    <td className="px-4 py-4 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="px-3 py-1 bg-transparent text-blue-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(cat)}
                        className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing 1 to {categories.length} of {categories.length} entries
          </div>
        </div>
      </div>

      {/* === EDIT CATEGORY MODAL === */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit Category</h2>
              <button onClick={closeEditModal} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleUpdateCategory}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Update
                </button>
                <button 
                  onClick={closeEditModal}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {isDeleteConfirmOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Confirm Delete</h2>
              <button onClick={cancelDelete} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Category?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to delete this category permanently?</p>
                <p className="text-sm font-black text-[#3b2063] uppercase">{categoryToDelete.name}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Delete
                </button>
                <button 
                  onClick={cancelDelete}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
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

export default InventoryCategoryList;