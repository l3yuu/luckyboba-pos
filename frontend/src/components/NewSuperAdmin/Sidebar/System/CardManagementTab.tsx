import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../../../../utils/authHelpers";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Search, CreditCard, Image as ImageIcon, Upload } from "lucide-react";

interface CardItem {
  id: number;
  title: string;
  image_url: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  available_months: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CardManagementTab = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global Settings State
  const [adminPhone, setAdminPhone] = useState("");
  const [adminGcashQrPreview, setAdminGcashQrPreview] = useState<string | null>(null);
  const [adminGcashQrFile, setAdminGcashQrFile] = useState<File | null>(null);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cards", {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cards", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/card-payment-settings", {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAdminPhone(data.data.admin_card_phone || "");
        setAdminGcashQrPreview(data.data.admin_card_gcash_qr || null);
      }
    } catch (err) {
      console.error("Failed to fetch global card settings", err);
    }
  }, []);

  useEffect(() => {
    fetchCards();
    fetchGlobalSettings();
  }, [fetchCards, fetchGlobalSettings]);

  const handleOpenModal = (card?: CardItem) => {
    setError(null);
    if (card) {
      setEditingCard(card);
      setTitle(card.title || "");
      setPrice(card.price ? card.price.toString() : "0");
      setIsActive(card.is_active ?? true);
      setSortOrder(card.sort_order ? card.sort_order.toString() : "0");
      
      let months: string[] = [];
      try {
        if (typeof card.available_months === 'string') {
          months = JSON.parse(card.available_months);
        } else if (Array.isArray(card.available_months)) {
          months = card.available_months;
        }
      } catch (e) {
        console.error("Failed to parse months", e);
      }
      setAvailableMonths(Array.isArray(months) ? months : []);
      
      setImagePreview(card.image_url || null);
      setImageFile(null);
    } else {
      setEditingCard(null);
      setTitle("");
      setPrice("300");
      setIsActive(true);
      setSortOrder("0");
      setAvailableMonths([...MONTHS]);
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleMonthToggle = (month: string) => {
    setAvailableMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title || !price) {
      setError("Title and Price are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("is_active", isActive ? "1" : "0");
    formData.append("sort_order", sortOrder || "0");
    formData.append("available_months", JSON.stringify(availableMonths));
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    let url = "/api/admin/cards";
    if (editingCard) {
      url = `/api/admin/cards/${editingCard.id}`;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchCards();
        // Optional: you could add a local "Toast" success state here
      } else {
        setError(data.message || data.error || "Failed to save card template.");
      }
    } catch (_err) {
      setError("Network error: Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      if (res.ok) fetchCards();
    } catch (_err) {
      console.error(_err);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/cards/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      if (res.ok) fetchCards();
    } catch (_err) {
      console.error(_err);
    }
  };

  const filteredCards = cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleSaveGlobal = async () => {
    setIsSavingGlobal(true);
    const formData = new FormData();
    formData.append("admin_card_phone", adminPhone);
    if (adminGcashQrFile) {
      formData.append("admin_card_gcash_qr", adminGcashQrFile);
    }

    try {
      const res = await fetch("/api/admin/card-payment-settings", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Success: maybe show a small toast or just update state
        fetchGlobalSettings();
        setAdminGcashQrFile(null);
        alert("Global payment settings updated!");
      } else {
        alert(data.message || "Failed to update global settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSavingGlobal(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col h-full fade-in font-['DM_Sans']">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Card Management</h1>
          <p className="text-zinc-500 text-sm">Manage membership card templates and global payment settings.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-[#3b2063] hover:bg-[#2d184b] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-purple-900/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>New Card Type</span>
        </button>
      </div>

      {/* Global Card Payment Settings Section */}
      <div className="mb-10 bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 bg-[#3b2063] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Upload size={18} className="text-white" />
            </div>
            <h3 className="font-bold text-white">Global Card Payment Settings</h3>
          </div>
        </div>
        
        <div className="p-6 grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider mb-2">Admin GCash Number</label>
              <input
                type="text"
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#3b2063]/20 focus:border-[#3b2063] transition-all outline-none font-medium"
                placeholder="e.g. 0917 XXX XXXX"
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value)}
              />
              <p className="text-xs text-zinc-400 mt-2">The contact number displayed to customers during card purchase.</p>
            </div>
            
            <button
              onClick={handleSaveGlobal}
              disabled={isSavingGlobal}
              className="flex items-center justify-center gap-2 bg-[#3b2063] hover:bg-[#2d184b] text-white px-5 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSavingGlobal ? "Saving..." : "Update Global Settings"}
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider block">Global GCash QR Code</label>
            <div className="flex items-center gap-6">
              <div 
                onClick={() => document.getElementById('global-qr-upload')?.click()}
                className="w-32 h-32 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-[#3b2063]/50 transition-all group"
              >
                {adminGcashQrPreview ? (
                  <img src={adminGcashQrPreview} className="w-full h-full object-cover" alt="Global QR" />
                ) : (
                  <Upload size={24} className="text-zinc-300" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Change QR</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Upload the primary GCash QR code for card membership payments.
                  Final customers will scan this to send the payment.
                </p>
                <input 
                  id="global-qr-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setAdminGcashQrFile(e.target.files[0]);
                      setAdminGcashQrPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#1a0f2e]">Card Templates</h3>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex relative w-full md:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-400" />
        </div>
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#3b2063]/20 focus:border-[#3b2063] transition-all outline-none font-medium text-zinc-700"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="sa-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-zinc-100 border-dashed">
          <CreditCard size={48} className="text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-800">No cards found</h3>
          <p className="text-zinc-500 text-sm mt-1">Get started by creating your first promotional card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 sa-scroll">
          {filteredCards.map((card) => (
            <div key={card.id} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-200 group flex flex-col">
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-zinc-100 mb-4 flex items-center justify-center">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="text-zinc-300" size={32} />
                )}
                
                <div className="absolute top-3 right-3">
                  <button 
                    onClick={() => handleToggleActive(card.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm border backdrop-blur-md transition-colors ${
                      card.is_active ? 'bg-emerald-500/90 text-white border-emerald-500' : 'bg-zinc-500/90 text-white border-zinc-500'
                    }`}
                  >
                    {card.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-1">{card.title}</h3>
                  <p className="text-xl font-extrabold text-[#3b2063]">₱{Number(card.price).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => handleOpenModal(card)}
                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-50 hover:bg-purple-50 text-zinc-700 hover:text-[#3b2063] py-2 rounded-lg font-bold text-sm transition-colors border border-zinc-200 hover:border-purple-200"
                  >
                    <Edit2 size={15} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 border border-red-100 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[1.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl fade-in border border-white/20">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-xl font-bold text-[#1a0f2e] flex items-center gap-2">
                <CreditCard size={20} className="text-[#3b2063]" />
                {editingCard ? "Edit Card Template" : "New Card Template"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-full transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto sa-scroll flex-1">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-center gap-2 fade-in">
                  <XCircle size={16} /> {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Details Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider mb-2">Card Title</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#3b2063]/20 focus:border-[#3b2063] transition-all outline-none font-medium"
                      placeholder="e.g. Valentines Card"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider mb-2">Price (₱)</label>
                      <input
                        type="number"
                        min="0" step="0.01"
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#3b2063]/20 focus:border-[#3b2063] transition-all outline-none font-bold text-lg"
                        placeholder="300"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider mb-2">Sort Order</label>
                      <input
                        type="number"
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#3b2063]/20 focus:border-[#3b2063] transition-all outline-none font-medium"
                        placeholder="1"
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div className={`relative w-12 h-6 flex items-center rounded-full transition-colors ${isActive ? "bg-[#3b2063]" : "bg-zinc-300"}`}>
                        <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${isActive ? "translate-x-7" : "translate-x-1"} shadow-sm`} />
                      </div>
                      <span className="font-bold text-zinc-700 group-hover:text-zinc-900">Active Status</span>
                    </label>
                  </div>
                </div>

                {/* Image & Months Column */}
                <div className="space-y-5">
                  
                  <div>
                    <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider mb-2">App Cover Image</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 hover:border-[#3b2063]/50 transition-all overflow-hidden relative">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="text-zinc-400" size={24} />
                          <span className="text-xs font-bold text-zinc-500">Click to upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[0.8rem] font-bold text-zinc-600 uppercase tracking-wider">Available Months</label>
                      <button 
                        onClick={() => setAvailableMonths(availableMonths.length === 12 ? [] : [...MONTHS])}
                        className="text-xs font-bold text-[#3b2063] hover:underline"
                      >
                        {availableMonths.length === 12 ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {MONTHS.map(month => (
                        <button
                          key={month}
                          onClick={() => handleMonthToggle(month)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            availableMonths.includes(month) 
                            ? 'bg-[#3b2063] text-white border-[#3b2063]' 
                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-100 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-[#3b2063] hover:bg-[#2d184b] text-white px-7 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="sa-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManagementTab;
