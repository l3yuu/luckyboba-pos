// Run this in browser console to clear current session
localStorage.removeItem('lucky_boba_token');
localStorage.removeItem('lucky_boba_authenticated');
localStorage.removeItem('lucky_boba_user_name');
localStorage.removeItem('lucky_boba_user_role');
localStorage.removeItem('lucky_boba_user_branch');
sessionStorage.clear();
window.location.href = '/login';
