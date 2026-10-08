import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import MenuIcon from '@mui/icons-material/Menu';

const Dashboard = ({ activeTab, children }) => {

    // Tailwind's `sm` breakpoint is 640px — the JS check must match it, otherwise
    // in the 600–639px range the static sidebar renders with mobile CSS (fixed
    // w-3/4 overlay) and covers the page with no way to close it.
    const [onMobile, setOnMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
    const [toggleSidebar, setToggleSidebar] = useState(false);
    const location = useLocation();

    // keep in sync when the window is resized / rotated
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 640px)');
        const onChange = (e) => {
            setOnMobile(!e.matches);
            if (e.matches) setToggleSidebar(false);
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // close the mobile drawer after navigating to another admin page
    useEffect(() => {
        setToggleSidebar(false);
    }, [location.pathname]);

    return (
        <>
            <main className="flex min-h-screen mt-4 sm:mt-0 sm:min-w-full">

                {!onMobile && <Sidebar activeTab={activeTab} />}
                {onMobile && toggleSidebar && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-0 sm:hidden"
                            onClick={() => setToggleSidebar(false)}
                        ></div>
                        <Sidebar activeTab={activeTab} setToggleSidebar={setToggleSidebar} />
                    </>
                )}

                <div className="w-full sm:flex-1 sm:ml-72 min-h-screen">
                    <div className="flex flex-col gap-6 sm:m-8 p-2 pb-6 overflow-hidden">
                        <button onClick={() => setToggleSidebar(true)} className="sm:hidden bg-gray-700 w-10 h-10 rounded-full shadow text-white flex items-center justify-center"><MenuIcon /></button>
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Dashboard;
