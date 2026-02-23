import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  itemCount: number;
}

const MAIN_CATEGORIES = [
  'Add Ons Sinkers',
  'AFFORDA-BOWLS',
  'ALA CARTE SNACKS',
  'CHICKEN WINGS',
  'HOT DRINKS',
  'HOT COFFEE',
];

const SubCategoryList = () => {
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [subCategoryName, setSubCategoryName] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState(MAIN_CATEGORIES[0]);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryData | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategoryData | null>(null);

  const [subCategories, setSubCategories] = useState<SubCategoryData[]>([
    { id: 1, name: "12oz", mainCategory: "HOT DRINKS", itemCount: 4 },
    { id: 2, name: "12oz", mainCategory: "HOT COFFEE", itemCount: 4 },
    { id: 3, name: "4PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 4, name: "6PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 5, name: "8oz", mainCategory: "HOT DRINKS", itemCount: 3 },
  ]);

  // ── ADD ──
  const openAddModal = () => {
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
    setIsAddModalOpen(true);
  };

  const handleAddSubCategory = () => {
    if (!subCategoryName.trim()) return;
    const newSub: SubCategoryData = {
      id: Date.now(),
      name: subCategoryName,
      mainCategory: selectedMainCategory,
      itemCount: 0,
    };
    setSubCategories([newSub, ...subCategories]);
    showToast(`Sub-category "${subCategoryName}" added successfully!`, 'success');
    setIsAddModalOpen(false);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  // ── EDIT ──
  const handleEditClick = (subCategory: SubCategoryData) => {
    setEditingSubCategory(subCategory);
    setSubCategoryName(subCategory.name);
    setSelectedMainCategory(subCategory.mainCategory);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubCategory = () => {
    if (!editingSubCategory || !subCategoryName.trim()) return;
    setSubCategories(subCategories.map(sub =>
      sub.id === editingSubCategory.id
        ? { ...sub, name: subCategoryName, mainCategory: selectedMainCategory }
        : sub
    ));
    showToast(`Sub-category "${subCategoryName}" updated successfully!`, 'success');
    setIsEditModalOpen(false);
    setEditingSubCategory(null);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubCategory(null);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  // ── DELETE ──
  const handleDeleteClick = (subCategory: SubCategoryData) => {
    setSubCategoryToDelete(subCategory);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!subCategoryToDelete) return;
    setSubCategories(subCategories.filter(sub => sub.id !== subCategoryToDelete.id));
    showToast(`Sub-category "${subCategoryToDelete.name}" deleted successfully!`, 'error');
    setIsDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  // ── Shared field renderer ──
  const renderFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Sub Category Name</label>
        <input
          type="text"
          value={subCategoryName}
          onChange={(e) => setSubCategoryName(e.target.value)}
          placeholder="e.g. 12oz, 6PC"
          className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] transition-all"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Main Category</label>
        <select
          value={selectedMainCategory}
          onChange={(e) => setSelectedMainCategory(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] transition-all cursor-pointer"
        >
          {MAIN_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">

        {/* === ADD SUB-CATEGORY FORM SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em] text-center">Add Sub Category</h2>
          </div>
          <div className="p-6 flex justify-end">
            <button
              onClick={openAddModal}
              className="bg-[#3b2063] hover:bg-[#2a1745] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add New
            </button>
          </div>
        </div>

        {/* === SUB-CATEGORY TABLE SECTION === */}
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
                {subCategories.map((sub, index) => (
                  <tr key={sub.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{sub.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">{sub.mainCategory}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{sub.itemCount}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleEditClick(sub)} className="px-3 py-1 bg-transparent text-blue-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteClick(sub)} className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {subCategories.length} Sub Categories
          </div>
        </div>
      </div>

      {/* === ADD SUB-CATEGORY MODAL === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Add Sub Category</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {renderFields()}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleAddSubCategory}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add New
                </button>
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT SUB-CATEGORY MODAL === */}
      {isEditModalOpen && editingSubCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit Sub Category</h2>
              <button onClick={closeEditModal} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {renderFields()}
              <div className="flex gap-3 pt-6">
                <button onClick={handleUpdateSubCategory} className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Update
                </button>
                <button onClick={closeEditModal} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {isDeleteConfirmOpen && subCategoryToDelete && (
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
                <h3 className="text-lg font-bold text-slate-800">Delete Sub Category?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to delete this sub category permanently?</p>
                <p className="text-sm font-black text-[#3b2063] uppercase">{subCategoryToDelete.name}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Delete
                </button>
                <button onClick={cancelDelete} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
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

export default SubCategoryList;