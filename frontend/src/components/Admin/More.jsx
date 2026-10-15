import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorder';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { logoutUser } from '../../actions/userAction';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
// "More" tab of the admin bottom nav — everything not in the 4 main tabs,
// presented as a native settings-style list.
const More = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);
    const { config } = useSiteConfig();
    const siteName = config?.branding?.name || 'Admin';
    const sections = [
        {
            title: 'Account',
            items: [
                { label: 'My Profile', desc: user?.name || 'Admin', icon: PersonOutlineIcon, to: '/account' },
                { label: 'Log out', desc: 'Sign out of this device', icon: LogoutOutlinedIcon, danger: true, action: () => { dispatch(logoutUser()); navigate('/login'); } },
            ],
        },
        {
            title: 'Settings',
            items: [
                { label: 'Cash on Delivery Orders', desc: 'Regular paid orders', icon: ReceiptLongOutlinedIcon, to: '/admin/orders' },
                { label: 'Add Product', desc: 'Create a new listing', icon: AddBoxOutlinedIcon, to: '/admin/new_product' },
                { label: 'Categories', desc: 'Website categories & images', icon: CategoryOutlinedIcon, to: '/admin/categories' },
                { label: 'Website Config', desc: 'API keys, SMTP, theme, SEO & more', icon: SettingsOutlinedIcon, to: '/admin/config' },
            ],
        },
        {
            title: 'Manage',
            items: [
                { label: 'Users', desc: 'Customers & roles', icon: GroupsOutlinedIcon, to: '/admin/users' },
                { label: 'Reviews', desc: 'Moderate product reviews', icon: StarBorderOutlinedIcon, to: '/admin/reviews' },
                { label: 'Live Chat Inbox', desc: 'Reply to store visitors', icon: ChatBubbleOutlineOutlinedIcon, to: '/admin/chat' },
            ],
        },
    ];
    return (
        <>
            <MetaData title="More | Admin" />
            <div className="pb-4">
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">More</h2>
                <p className="text-xs text-gray-500 mb-4">Account, settings &amp; management</p>
                {sections.map((sec) => (
                    <div key={sec.title} className="mb-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            {sec.title}
                        </p>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            {sec.items.map((it) => {
                                const Icon = it.icon;
                                const content = (
                                    <>
                                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            it.danger ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-black'
                                        }`}>
                                            <Icon sx={{ fontSize: '19px' }} />
                                        </span>
                                        <span className="min-w-0 flex-1 text-left">
                                            <span className={`block text-sm font-semibold ${
                                                it.danger ? 'text-red-600' : 'text-gray-900'
                                            }`}>
                                                {it.label}
                                            </span>
                                            <span className="block text-xs text-gray-500 truncate">{it.desc}</span>
                                        </span>
                                        {!it.danger && <ChevronRightIcon sx={{ fontSize: '18px', color: '#cbd5e1' }} />}
                                    </>
                                );
                                const cls = 'w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors';
                                return it.to ? (
                                    <button key={it.label} onClick={() => navigate(it.to)} className={cls + ' border-b border-gray-100 last:border-0'}>
                                        {content}
                                    </button>
                                ) : (
                                    <button key={it.label} onClick={it.action} className={cls + ' border-b border-gray-100 last:border-0'}>
                                        {content}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <p className="text-center text-[11px] text-gray-400">{siteName} Admin &copy; {new Date().getFullYear()}</p>
            </div>
        </>
    );
};
export default More;
