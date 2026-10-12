import { useEffect, useState } from 'react';
import axios from 'axios';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

// MegaMart-style top micro-bar:
//   left: brand tagline  |  right: Deliver to · Track your order · All Offers
const AnnouncementBar = () => {
    const [announcement, setAnnouncement] = useState(DEFAULT_SITE_CONFIG.announcement);

    useEffect(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (res.data?.config?.announcement) {
                    setAnnouncement(res.data.config.announcement);
                }
            })
            .catch(() => {});
    }, []);

    const desktop = Array.isArray(announcement.desktop) ? announcement.desktop : [];
    const mobile = announcement.mobile || '';

    return (
        <div
            className="w-full select-none text-xs"
            style={{ backgroundColor: 'var(--color-announcement)', color: 'var(--color-announcement-text)' }}
        >
            {/* Desktop */}
            <div className="hidden md:flex max-w-7xl mx-auto px-4 lg:px-6 h-8 items-center justify-between gap-4">
                {/* Left: main brand message */}
                <span className="font-medium opacity-90 truncate">
                    {desktop[0] || 'Welcome to TechBazar — Cash on delivery nationwide'}
                </span>

                {/* Right: utility links */}
                <div className="flex items-center gap-5 shrink-0 opacity-90">
                    {desktop.slice(1).map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                            {i === 0 && <LocationOnIcon sx={{ fontSize: '13px' }} />}
                            {i === 1 && <TrackChangesIcon sx={{ fontSize: '13px' }} />}
                            {i === 2 && <LocalOfferIcon sx={{ fontSize: '13px' }} />}
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Mobile: scrolling ticker */}
            <div className="md:hidden h-7 flex items-center overflow-hidden">
                <div className="flex items-center whitespace-nowrap animate-marquee text-[11px] leading-none opacity-90">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="px-4">
                            {i % 2 === 1 && <span className="mr-3 opacity-50">•</span>}
                            {mobile}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBar;
