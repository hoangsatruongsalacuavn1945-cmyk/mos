import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../utils/userStore';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-900/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-red-400 border border-red-800">
            TRUY CẬP BỊ TỪ CHỐI (403 ACCESS DENIED)
          </span>
          <h2 className="text-xl font-black text-white">Bạn Không Có Quyền Truy Cập</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Khu vực này yêu cầu quyền hạn cấp cao hơn. Tài khoản hiện tại của bạn: <b className="text-amber-300">{user.name}</b> (Vai trò: <span className="uppercase font-bold">{user.role}</span>).
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ Học Viên</span>
          </Link>

          <Link
            to="/login"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700"
          >
            Đổi Tài Khoản
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
