import { useState, ReactNode } from 'react';
import { UserCircle, LogOut, X } from 'lucide-react';
import { AuthUser, demoUser, getAuthUsers, getCurrentUser, saveCurrentUser } from '../services/authStorage';

interface Props {
  rightContent?: ReactNode;
}

export default function TitleBar({ rightContent }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const resetAuthForms = () => {
    setLoginAccount('');
    setLoginPassword('');
    setAuthMessage('');
  };

  const openLoginModal = () => {
    resetAuthForms();
    setShowLoginModal(true);
    setShowUserMenu(false);
  };

  const closeAuthModal = () => {
    setShowLoginModal(false);
    resetAuthForms();
  };

  const handleLogin = () => {
    const account = loginAccount.trim();
    const password = loginPassword.trim();

    if (!account || !password) {
      setAuthMessage('请输入账号和密码');
      return;
    }

    const user = getAuthUsers().find((item) => item.account === account && item.password === password);
    if (!user) {
      setAuthMessage('账号或密码错误');
      return;
    }

    setCurrentUser(user);
    saveCurrentUser(user);
    closeAuthModal();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
    setShowUserMenu(false);
  };

  return (
    <div className="h-9 bg-primary-nav flex items-center justify-between px-4 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-up flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">C</span>
        </div>
        <span className="text-sm font-semibold text-white">财瞳金融</span>
      </div>
      <div className="flex items-center gap-2 relative">
        {rightContent}
        <button
          onClick={() => currentUser ? setShowUserMenu(!showUserMenu) : openLoginModal()}
          className="text-secondary hover:text-white transition-colors"
        >
          <UserCircle size={18} />
        </button>

        {currentUser && showUserMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
            <div className="absolute right-0 top-full mt-2 z-40 w-52 bg-[#1A1D23] border border-[#2C303A] rounded-lg shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                    <UserCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{currentUser.nickname}</div>
                    <div className="text-secondary text-xs">{currentUser.account}</div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary">会员等级</span>
                  <span className="text-xs font-semibold text-yellow-400">{currentUser.level}</span>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-700/50">
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-secondary hover:text-red-400 transition-colors">
                  <LogOut size={12} /> 退出登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[360px] rounded-xl border border-[#2C303A] bg-[#1A1D23] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
              <div>
                <div className="text-base font-semibold text-white">登录财瞳金融</div>
                <div className="mt-1 text-xs text-secondary">请输入账号和密码继续使用</div>
              </div>
              <button onClick={closeAuthModal} className="text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="text-xs text-secondary">账号</span>
                <input
                  value={loginAccount}
                  onChange={(event) => setLoginAccount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-primary-bg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="mx_9hgz3w3knx"
                />
              </label>
              <label className="block">
                <span className="text-xs text-secondary">密码</span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-primary-bg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="demo123"
                />
              </label>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
                Demo 账号：<span className="font-mono text-white">{demoUser.account}</span>
                <span className="mx-2 text-secondary">|</span>
                密码：<span className="font-mono text-white">{demoUser.password}</span>
              </div>
              {authMessage && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{authMessage}</div>}
            </div>

            <div className="border-t border-gray-700/50 px-5 py-4">
              <button
                onClick={handleLogin}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
