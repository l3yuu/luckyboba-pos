import { useState } from 'react';
import TopNavbar from '../TopNavbar';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  itemCount: number;
}

const SubCategoryList = () => {
  const [subCategoryName, setSubCategoryName] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('Add Ons Sinkers');

  // Initial data based on the provided reference image
  const [subCategories, setSubCategories] = useState<SubCategoryData[]>([
    { id: 1, name: "12oz", mainCategory: "HOT DRINKS", itemCount: 4 },
    { id: 2, name: "12oz", mainCategory: "HOT COFFEE", itemCount: 4 },
    { id: 3, name: "4PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 4, name: "6PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 5, name: "8oz", mainCategory: "HOT DRINKS", itemCount: 3 },
  ]);

  const handleAddSubCategory = () => {
    if (!subCategoryName) return;
    const newSub: SubCategoryData = {
      id: Date.now(),
      name: subCategoryName,
      mainCategory: selectedMainCategory,
      itemCount: 0
    };
    setSubCategories([newSub, ...subCategories]);
    setSubCategoryName('');
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* === ADD SUB-CATEGORY FORM SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.2em] text-center">Add Sub Category</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col xl:flex-row xl:items-end gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sub Category Name</label>
                <input 
                  type="text" 
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10"
                  placeholder="e.g. 12oz, 6PC"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Main Category</label>
                <select 
                  value={selectedMainCategory}
                  onChange={(e) => setSelectedMainCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-10 cursor-pointer"
                >
                  <option>Add Ons Sinkers</option>
                  <option>AFFORDA-BOWLS</option>
                  <option>ALA CARTE SNACKS</option>
                  <option>CHICKEN WINGS</option>
                  <option>HOT DRINKS</option>
                  <option>HOT COFFEE</option>
                </select>
              </div>
              <button 
                onClick={handleAddSubCategory}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add New
              </button>
            </div>
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
                      <button className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
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
    </div>
  );
};

export default SubCategoryList;