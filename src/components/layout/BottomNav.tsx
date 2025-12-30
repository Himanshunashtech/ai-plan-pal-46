import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';

const BottomNav = () => {
    const location = useLocation();
    const isNavHidden = useHideOnScroll();

    return (
        <nav className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50
      transition-transform duration-300 ease-out
      ${isNavHidden ? 'translate-y-full' : 'translate-y-0'}`}>
            <div className="relative flex items-center justify-around py-2 ">
                {/* Home */}
                <Link
                    to="/dashboard"
                    className={`flex flex-col items-center gap-0.5 px-4 ${location.pathname === '/dashboard'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                        }`}
                >
                    <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    <span className="text-[10px]">Home</span>
                </Link>

                {/* Analytics */}
                <Link
                    to="/progress"
                    className={`flex flex-col items-center gap-0.5 px-4 ${location.pathname === '/progress'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                        }`}
                >
                    <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    <span className="text-[10px]">Analytics</span>
                </Link>

                {/* Settings (extra right spacing so it doesn't go under +) */}
                <Link
                    to="/profile"
                    className={`flex flex-col items-center gap-0.5 px-4 pr-16 ${location.pathname === '/profile'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                        }`}
                >
                    <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span className="text-[10px]">Settings</span>
                </Link>

                {/* FLOATING + BUTTON */}
                <Link
                    to="/scanner"
                    className="absolute -top-6 right-4"
                >
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-xl active:scale-95 transition-transform">
                        <Plus className="w-7 h-7 text-white" />
                    </div>
                </Link>
            </div>
        </nav>
    );
};

export default BottomNav;
