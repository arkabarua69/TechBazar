import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OffersIcon from '@mui/icons-material/LocalOffer';
import Searchbar from './Searchbar';
import PrimaryDropDownMenu from './PrimaryDropDownMenu';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import AnnouncementBar from '../../Home/AnnouncementBar';
import { useSiteConfig } from '../../../context/SiteConfigContext';

const Header = () => {

  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { cartItems } = useSelector(state => state.cart);
  const [togglePrimaryDropDown, setTogglePrimaryDropDown] = useState(false);
  const { config } = useSiteConfig();

  const brandName = config.branding?.name || 'Store';
  const logoUrl = config.branding?.logoUrl;

  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  const wordmark = (
    <span className="font-display font-extrabold text-xl tracking-tight whitespace-nowrap" style={{ color: 'var(--color-accent)' }}>
      {brandName}
    </span>
  );

  if (isAdmin) return null;

  return (
    <header className="hidden md:block fixed top-0 w-full z-10" style={{ backgroundColor: 'var(--color-header)', borderBottom: '1px solid var(--color-border)' }}>

      {/* ── Top micro-bar: announce strip ── */}
      <AnnouncementBar />

      {/* ── Main navbar row ── */}
      <div className="w-full" style={{ backgroundColor: 'var(--color-header)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2 mr-2">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[140px] object-contain" draggable="false" />
            ) : (
              wordmark
            )}
          </Link>

          {/* Search — takes most of the horizontal space */}
          <div className="flex-1 max-w-2xl">
            <Searchbar />
          </div>

          {/* Right utility nav */}
          <div className="flex items-center gap-4 ml-auto shrink-0">

            {/* Deliver to */}
            <div className="hidden lg:flex items-center gap-1.5 cursor-pointer group">
              <LocationOnIcon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Deliver to</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Select Location</span>
              </div>
            </div>

            {/* Track order */}
            <Link to="/track" className="hidden lg:flex items-center gap-1.5 group">
              <TrackChangesIcon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Track</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your order</span>
              </div>
            </Link>

            {/* Image Gallery */}
            <Link to="/gallery" className="hidden lg:flex items-center gap-1.5 group">
              <PhotoLibraryIcon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Image</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Gallery</span>
              </div>
            </Link>

            {/* All Offers */}
            <div className="hidden lg:flex items-center gap-1.5 cursor-pointer">
              <OffersIcon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>All</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Offers</span>
              </div>
            </div>

            {/* Sign in / Account */}
            <div className="relative">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
                  style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                >
                  Sign In/Join
                </Link>
              ) : (
                <button
                  className="flex items-center gap-2 text-sm font-semibold transition"
                  style={{ color: 'var(--color-text-primary)' }}
                  onClick={(e) => { e.stopPropagation(); setTogglePrimaryDropDown(!togglePrimaryDropDown); }}
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.name}
                      draggable="false"
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      style={{ border: '1px solid var(--color-border)' }}
                    />
                  ) : (
                    <AccountCircleIcon sx={{ fontSize: '26px', color: 'var(--color-accent)' }} />
                  )}
                  <span className="hidden lg:inline">{user.name?.split(' ', 1)}</span>
                  {togglePrimaryDropDown
                    ? <ExpandLessIcon sx={{ fontSize: '16px' }} />
                    : <ExpandMoreIcon sx={{ fontSize: '16px' }} />}
                </button>
              )}
              {togglePrimaryDropDown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTogglePrimaryDropDown(false)} />
                  <div className="relative z-50">
                    <PrimaryDropDownMenu
                      setTogglePrimaryDropDown={setTogglePrimaryDropDown}
                      user={user}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative flex items-center gap-1.5 group">
              <div className="relative">
                <ShoppingCartIcon sx={{ fontSize: '26px', color: 'var(--color-accent)' }} />
                {cartItems.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    {cartItems.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>My</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Cart</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
