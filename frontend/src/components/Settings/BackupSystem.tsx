<<<<<<< HEAD
import TopNavbar from '../TopNavbar';
=======
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
import { ArrowLeft, Database } from 'lucide-react';

const BackupSystem = ({ onBack }: { onBack: () => void }) => (
  <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col font-sans">
<<<<<<< HEAD
    <TopNavbar />
=======
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">System Backup</h1>
      <div className="bg-white p-6 rounded-xl border border-zinc-200 flex items-center gap-4">
        <Database className="text-emerald-500" />
        <p className="text-xs font-bold text-slate-700 uppercase">Last backup: February 11, 2026</p>
      </div>
<<<<<<< HEAD
      <button onClick={onBack} className="w-fit px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> Back to settings</button>
=======
      <button onClick={onBack} className="w-fit px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> Back</button>
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
    </div>
  </div>
);
export default BackupSystem;