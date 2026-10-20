import { Wrench, Clock } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

const MaintenancePage = ({ message }) => {
    const { config } = useSiteConfig();
    const msg = message || (config && config.general && config.general.maintenanceMessage) || 'We are performing maintenance. Please check back soon.';
    const brand = (config && config.branding && config.branding.name) || 'GeForce HuB';
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shadow-sm">
                    <Wrench size={36} strokeWidth={2} />
                </div>
                <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">{brand}</h1>
                <p className="mt-2 text-sm font-semibold text-[#E84B0F] uppercase tracking-wide">Under Maintenance</p>
                <p className="mt-4 text-gray-600 leading-relaxed">{msg}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} /> We'll be back shortly
                </div>
                <p className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} {brand}. All rights reserved.</p>
            </div>
        </div>
    );
};

export default MaintenancePage;
