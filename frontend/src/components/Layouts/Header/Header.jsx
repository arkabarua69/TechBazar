import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import Searchbar from './Searchbar';
import PrimaryDropDownMenu from './PrimaryDropDownMenu';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import AnnouncementBar from '../../Home/AnnouncementBar';

// Modern desktop navbar (Cloud White): logo · centered pill search ·
// Track / Cart / Account — clean icon+label links, no nested "More" menu.
// (The navbar row is desktop-only; mobile uses the bottom bar.)
const Header = () => {

  const { isAuthenticated, user } = useSelector((state) => state.user);

  const { cartItems } = useSelector(state => state.cart);

  const [togglePrimaryDropDown, setTogglePrimaryDropDown] = useState(false);

  // /admin has its own app bar (mobile) + sidebar (desktop) — hide the store
  // announcement strip there so the admin chrome owns the top edge.
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (

    <header className="bg-white border-b border-line fixed top-0 w-full z-10">

      {/* top announcement strip — above the navbar; visible on mobile too
          (only the navbar row below is desktop-only) */}
      {!isAdmin && <AnnouncementBar />}

      {/* navbar row (desktop only — mobile uses the bottom bar) */}
      <div className="hidden md:flex w-full sm:w-11/12 px-4 py-2.5 m-auto items-center gap-4 relative">

        {/* logo */}
        <Link className="shrink-0" to="/">
          <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight whitespace-nowrap">
            Tech<span className="text-primary-accent">Bazar</span>
          </span>
        </Link>

        {/* search — centered pill */}
        <div className="flex-1 max-w-xl mx-auto">
          <Searchbar />
        </div>

        {/* right navs */}
        <div className="flex items-center gap-1 sm:gap-5 ml-auto relative">

          {isAuthenticated === false ?
            <Link to="/login" className="btn-accent rounded-lg px-4 py-1.5 text-sm cursor-pointer">Login</Link>
            :
            (
              <span className="flex items-center text-slate-700 hover:text-primary-accent font-medium gap-1 cursor-pointer transition" onClick={() => setTogglePrimaryDropDown(!togglePrimaryDropDown)}>{user.name && user.name.split(" ", 1)}
                <span>{togglePrimaryDropDown ? <ExpandLessIcon sx={{ fontSize: "16px" }} /> : <ExpandMoreIcon sx={{ fontSize: "16px" }} />}</span>
              </span>
            )
          }

          {togglePrimaryDropDown && <PrimaryDropDownMenu setTogglePrimaryDropDown={setTogglePrimaryDropDown} user={user} />}

          <Link to="/track" className="flex items-center text-slate-700 hover:text-primary-accent font-medium gap-1.5 transition">
            <TrackChangesIcon sx={{ fontSize: '18px' }} />
            Track Order
          </Link>

          <Link to="/cart" className="flex items-center text-slate-700 hover:text-primary-accent font-medium gap-2 relative transition">
            <span><ShoppingCartIcon /></span>
            {cartItems.length > 0 &&
              <div className="w-5 h-5 p-2 bg-primary-accent text-white text-xs rounded-full absolute -top-2 left-3 flex justify-center items-center border border-white">
                {cartItems.length}
              </div>
            }
            Cart
          </Link>
        </div>
        {/* right navs */}

      </div>
      {/* navbar row */}
    </header>
  )
};

export default Header;
