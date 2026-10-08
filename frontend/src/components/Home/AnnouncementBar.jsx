import { useEffect, useState } from 'react';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

// Very top strip of the site — sits ABOVE the navbar (inside the fixed header).
// Desktop: 3 facts in one line. Mobile: one app-style single-line ticker.
const AnnouncementBar = () => {
    const [announcement, setAnnouncement] = useState(DEFAULT_SITE_CONFIG.announcement);

    useEffect(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => res.data && res.data.config && res.data.config.announcement &&
                setAnnouncement(res.data.config.announcement))
            .catch(() => { /* keep defaults */ });
    }, []);

    const desktop = Array.isArray(announcement.desktop) ? announcement.desktop : [];
    const mobile = announcement.mobile || '';

    return (
        <div className="bg-slate-900 border-b border-white/10 text-white overflow-hidden select-none">
            {/* desktop: one line, 3 facts */}
            <div className="hidden sm:flex h-8 items-center justify-center gap-6 px-4 text-xs whitespace-nowrap">
                {desktop.map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-slate-200">
                        {item}
                        {i < desktop.length - 1 && <span className="w-px h-3 bg-white/20 ml-4" />}
                    </span>
                ))}
            </div>

            {/* mobile: single-line scrolling ticker (never wraps) */}
            <div className="sm:hidden h-7 flex items-center overflow-hidden">
                <div className="flex items-center whitespace-nowrap animate-marquee text-[11px] leading-none">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="px-3 text-slate-200">
                            {i % 2 === 1 && <span className="text-white/40 mr-3">•</span>}
                            {mobile}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBar;
