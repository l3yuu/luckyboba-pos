const fs = require('fs');
let content = fs.readFileSync('src/pages/Kiosk/KioskPage.tsx', 'utf8');

// 1. Add Key import
content = content.replace('  Lock,\n  Globe,', '  Lock,\n  Key,\n  Globe,');

// 2. Add locked step
content = content.replace(
  "const [step, setStep] = useState<'splash' | 'order_type' | 'menu' | 'confirm' | 'select_branch'>('splash');",
  "const [step, setStep] = useState<'locked' | 'splash' | 'order_type' | 'menu' | 'confirm' | 'select_branch'>('splash');"
);

// 3. Add accessPassword state
content = content.replace(
  "const [pinError, setPinError] = useState(false);\n",
  "const [pinError, setPinError] = useState(false);\n  const [accessPassword, setAccessPassword] = useState('');\n  const [accessError, setAccessError] = useState(false);\n  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);\n"
);

// 4. Add isUnlocked check 1
content = content.replace(
  "localStorage.setItem('kiosk_branch_id', bIdAttr);\n\n        try {",
  `localStorage.setItem('kiosk_branch_id', bIdAttr);

        // Check if unlocked for this session
        const isUnlocked = sessionStorage.getItem(\`kiosk_unlocked_\${parsedId}\`) === 'true';
        if (!isUnlocked) {
          setStep('locked');
        }

        try {`
);

// 5. Add isUnlocked check 2
content = content.replace(
  "setBranchName(branch.name);\n    localStorage.setItem('kiosk_branch_id', branch.id.toString());\n    setSelectedBranchToConfirm(null);\n    setStep('splash');",
  `setBranchName(branch.name);
    setAccessPassword('');
    setAccessError(false);
    localStorage.setItem('kiosk_branch_id', branch.id.toString());
    setSelectedBranchToConfirm(null);

    // Check if unlocked for this session
    const isUnlocked = sessionStorage.getItem(\`kiosk_unlocked_\${branch.id}\`) === 'true';
    if (!isUnlocked) {
      setStep('locked');
    } else {
      setStep('splash');
    }`
);

// 6. Add handleVerifyPassword
content = content.replace(
  "const addToCart = (item: MenuItem, addons: AddOnOption[] = [], sugar: string = '100%') => {",
  `const handleVerifyPassword = async () => {
    if (!branchId || !accessPassword) return;
    setIsVerifyingPassword(true);
    setAccessError(false);
    try {
      const response = await api.post('/kiosk/verify-password', {
        password: accessPassword,
        branch_id: branchId
      });

      if (response.data.success) {
        sessionStorage.setItem(\`kiosk_unlocked_\${branchId}\`, 'true');
        setStep('splash');
        setAccessPassword('');
      } else {
        setAccessError(true);
      }
    } catch (_err) {
      setAccessError(true);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const addToCart = (item: MenuItem, addons: AddOnOption[] = [], sugar: string = '100%') => {`
);

// 7. Replace `#7c14d4` with `#a020f0` globally
content = content.split('#7c14d4').join('#a020f0');

// 8. Replace mix match modal styles (orange/amber instead of purple)
// "bg-gradient-to-r from-[#a020f0] to-purple-500 text-white px-12 py-5 rounded-[2rem]" -> "bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider text-base flex items-center gap-3 hover:from-orange-600 hover:to-amber-600 transition-all shadow-[0_8px_20px_rgba(234,88,12,0.3)] hover:shadow-[0_12px_25px_rgba(234,88,12,0.4)] hover:-translate-y-[1px] active:scale-95"
content = content.replace(
  "className=\"bg-gradient-to-r from-[#a020f0] to-purple-500 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-wider text-xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-purple-200\"",
  "className=\"bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider text-base flex items-center gap-3 hover:from-orange-600 hover:to-amber-600 transition-all shadow-[0_8px_20px_rgba(234,88,12,0.3)] hover:shadow-[0_12px_25px_rgba(234,88,12,0.4)] hover:-translate-y-[1px] active:scale-95\""
);

content = content.replace(
  "{loading && step !== 'menu' && (",
  "{loading && step !== 'menu' && step !== 'locked' && ("
);

// Add AccessLockView before KioskLayout
const accessLockViewStr = `
  const AccessLockView = () => (
    <div
      className="flex-1 flex flex-col items-center justify-center p-12 overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #1a0b2e 0%, #2e1065 45%, #4c1d95 78%, #5b21b6 100%)'
      }}
    >
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] bg-fuchsia-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center relative z-10">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-inner">
          <Lock size={32} className="text-white" />
        </div>

        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Kiosk Locked</h1>
        <p className="text-violet-200 text-sm font-medium mb-8 text-center px-4">
          Please enter the access password to unlock this kiosk for customer use.
        </p>

        <div className="w-full space-y-4">
          <div className="relative group">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-300 group-focus-within:text-white transition-colors" size={20} />
            <input
              type="password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
              placeholder="Enter Password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-lg font-bold placeholder:text-violet-300/50 focus:bg-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10 outline-none transition-all tracking-widest"
              autoFocus
            />
          </div>

          {accessError && (
            <p className="text-red-400 text-xs font-black uppercase tracking-widest text-center animate-bounce">
              Invalid access password
            </p>
          )}

          <button
            onClick={handleVerifyPassword}
            disabled={isVerifyingPassword || !accessPassword}
            className="w-full bg-white text-[#2e1065] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-violet-50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {isVerifyingPassword ? 'Verifying...' : 'Unlock Kiosk'}
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto opacity-50" />
          <p className="text-violet-300/40 text-[9px] font-black uppercase tracking-widest">
            Branch Security System v2.4
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('kiosk_branch_id');
          window.location.reload();
        }}
        className="absolute bottom-10 text-white/30 hover:text-white/60 font-black text-[10px] uppercase tracking-[0.3em] transition-colors"
      >
        Change Branch Location
      </button>
    </div>
  );

  return (
    <KioskLayout>
      <div className="h-full flex flex-col bg-white print:hidden overflow-hidden">
        {step === 'locked' && AccessLockView()}`;

content = content.replace(
  "  return (\n    <KioskLayout>\n      <div className=\"h-full flex flex-col bg-white print:hidden overflow-hidden\">\n",
  accessLockViewStr + "\n"
);


fs.writeFileSync('src/pages/Kiosk/KioskPage.tsx', content);
