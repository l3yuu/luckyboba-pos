import { ArrowLeft, Upload } from 'lucide-react';

const UploadData = ({ onBack }: { onBack: () => void }) => (
  <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col font-sans">
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Upload Data</h1>
      <div className="bg-white p-12 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center gap-4">
        <Upload size={48} className="text-zinc-300" />
        <p className="text-xs font-bold text-zinc-400 uppercase">Drop files here to upload</p>
      </div>
      <button onClick={onBack} className="w-fit px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> Back</button>
    </div>
  </div>
);
export default UploadData;