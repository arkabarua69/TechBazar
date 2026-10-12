import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import AdminAppBar from './AdminAppBar';

const Dashboard = ({ activeTab, children }) => {
    const [onMobile, setOnMobile] = useState(() =>
        typeof window !== 'undefined' && window.innerWidth < 640
    );
    const [toggleSidebar, setToggleSidebar] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 640px)');
        const onChange = (e) => {
            setOnMobile(!e.matches);
            if (e.matches) setToggleSidebar(false);
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        setToggleSidebar(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    return (
        <main className="flex min-h-screen overflow-x-hidden">
            {/* Sidebar */}
            {!onMobile && <Sidebar activeTab={activeTab} />}
            {onMobile && toggleSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-50 sm:hidden backdrop-blur-sm"
                        onClick={() => setToggleSidebar(false)}
                    />
                    <Sidebar activeTab={activeTab} setToggleSidebar={setToggleSidebar} />
                </>
            )}

            {/* Main content */}
            <div
                className="w-full sm:flex-1 sm:ml-72 min-h-screen overflow-x-hidden"
                style={{ backgroundColor: '#FDF5EF' }}
            >
                {onMobile && (
                    <AdminAppBar onMenu={() => setToggleSidebar(true)} />
                )}

                <div
                    className={`flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8 overflow-hidden ${onMobile ? 'pt-16' : 'pt-6'}`}
                >
                    {children}
                </div>
            </div>
        </main>
    );
};

export default Dashboard;
