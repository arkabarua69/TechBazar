import { useNavigate } from 'react-router-dom';


import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import ChatIcon from '@mui/icons-material/Chat';
import FolderSharedIcon from '@mui/icons-material/FolderShared';

import FavoriteIcon from '@mui/icons-material/Favorite';
import RateReviewIcon from '@mui/icons-material/RateReview';
import KeyIcon from '@mui/icons-material/Key';

// Flipkart-style account nav. Grouped rows with a section label, then the
// individual links. The active tab gets an accent left rail + tinted row.
//
// `mobile` renders the same grouped list as a full-width app screen (the
// account page uses it for its phone layout); `onNavigate` fires on every row
// pick so the page can drill into the selected section.
const AccountSidebar = ({ activeTab, onSelect, onNavigate, mobile = false }) => {
    const navigate = useNavigate();
    // Tabs that live on the /account page. The orders page reuses this sidebar,
    // so selecting one of those rows has to navigate there with the tab in the
    // query string — otherwise the click would only flip local state.
    const ACCOUNT_TABS = ['profile', 'edit', 'addresses', 'wishlist', 'chat', 'security', 'faqs'];
    const handleSelect = (tab) => {
        if (ACCOUNT_TABS.includes(tab)) {
            navigate(`/account?tab=${tab}`);
            onNavigate?.(tab);
            return;
        }
        onSelect?.(tab);
        onNavigate?.(tab);
    };


    // A tab row inside a group. `soon` rows are non-interactive.
    const Row = ({ icon, label, tab, soon, badge }) => {
        const isActive = !soon && activeTab === tab;
        const content = (
            <>
                <span
                    className="shrink-0 transition-colors"
                    style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                >
                    {icon}
                </span>
                <span className="flex-1 min-w-0 truncate text-left">{label}</span>
                {soon ? (
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                    >
                        Soon
                    </span>
                ) : badge ? (
                    <span
                        className="text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                    >
                        {badge}
                    </span>
                ) : (
                    isActive && <ChevronRightIcon sx={{ fontSize: 16, color: 'var(--color-accent)' }} className="shrink-0" />
                )}
            </>
        );

        const cls = `flex items-center gap-3 w-full px-4 py-3.5 text-[13px] transition-all duration-150 border-l-[3px] ${soon ? 'cursor-not-allowed' : 'cursor-pointer'}`;
        const style = {
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontWeight: isActive ? 600 : 500,
            borderLeftColor: isActive ? 'var(--color-accent)' : 'transparent',
            backgroundColor: isActive ? 'var(--accent-06)' : 'transparent',
            opacity: soon ? 0.75 : 1,
        };

        if (soon) {
            return <div className={cls} style={style}>{content}</div>;
        }

        return (
            <button
                type="button"
                onClick={() => handleSelect(tab)}
                className={cls}
                style={style}
                onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--accent-03)';
                        e.currentTarget.style.color = 'var(--color-accent)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                }}
            >
                {content}
            </button>
        );
    };

    const Group = ({ icon, label, children }) => (
        <>
            <div
                className="flex items-center gap-2.5 px-4 py-2.5"
                style={{
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    // Soft accent tint — sits inside the white card without
                    // colliding with the page background token.
                    backgroundColor: 'var(--color-accent-light)',
                }}
            >
                <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                <span
                    className="text-[12px] font-extrabold uppercase tracking-widest"
                    style={{ color: 'var(--color-accent)' }}
                >
                    {label}
                </span>
                <span
                    className="flex-1 h-px ml-1"
                    style={{ backgroundColor: 'var(--color-border)' }}
                />
            </div>
            <div className="flex flex-col py-1.5">{children}</div>
        </>
    );

    return (
        <aside className={mobile
            ? 'md:hidden w-full'
            : 'hidden md:flex flex-col gap-4 w-[280px] shrink-0'}>
            {/* Nav */}
            <nav
                className="overflow-hidden"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    // Mobile (drawer) uses boxy corners; desktop keeps the
                    // rounded card look.
                    borderRadius: mobile ? '0' : 'var(--card-radius)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <Group icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Account Settings">
                    <Row icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Profile Information" tab="profile" />
                    <Row icon={<EditIcon sx={{ fontSize: 18 }} />} label="Edit Profile" tab="edit" />
                    <Row icon={<FolderIcon sx={{ fontSize: 18 }} />} label="Manage Addresses" tab="addresses" />
                </Group>

                <Group icon={<ChatIcon sx={{ fontSize: 18 }} />} label="My Tickets">
                    <Row icon={<ChatIcon sx={{ fontSize: 18 }} />} label="Support Ticket" tab="chat" />
                </Group>

                <Group icon={<FolderSharedIcon sx={{ fontSize: 18 }} />} label="My Stuff">
                    <Row icon={<FavoriteIcon sx={{ fontSize: 18 }} />} label="My Wishlist" tab="wishlist" />
                    <Row icon={<RateReviewIcon sx={{ fontSize: 18 }} />} label="Reviews & Ratings" soon />
                </Group>

                <Group icon={<KeyIcon sx={{ fontSize: 18 }} />} label="Security">
                    <Row icon={<KeyIcon sx={{ fontSize: 18 }} />} label="Change Password" tab="security" />
                </Group>

            </nav>
        </aside>
    );
};

export default AccountSidebar;
