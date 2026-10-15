import WebFont from 'webfontloader';
import Footer from './components/Layouts/Footer/Footer';
import Header from './components/Layouts/Header/Header';
import BottomBar from './components/Layouts/BottomBar';
import Login from './components/User/Login';
import Register from './components/User/Register';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { loadUser } from './actions/userAction';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import UpdateProfile from './components/User/UpdateProfile';
import UpdatePassword from './components/User/UpdatePassword';
import ForgotPassword from './components/User/ForgotPassword';
import ResetPassword from './components/User/ResetPassword';
import Account from './components/User/Account';
import ProtectedRoute from './Routes/ProtectedRoute';
import Home from './components/Home/Home';
import ProductDetails from './components/ProductDetails/ProductDetails';
import Products from './components/Products/Products';
import Cart from './components/Cart/Cart';
import Shipping from './components/Cart/Shipping';
import OrderConfirm from './components/Cart/OrderConfirm';
import Payment from './components/Cart/Payment';
import OrderStatus from './components/Cart/OrderStatus';
import OrderSuccess from './components/Cart/OrderSuccess';
import MyOrders from './components/Order/MyOrders';
import OrderDetails from './components/Order/OrderDetails';
import Dashboard from './components/Admin/Dashboard';
import MainData from './components/Admin/MainData';
import Orders from './components/Admin/Orders';
import UpdateOrder from './components/Admin/UpdateOrder';
import ProductTable from './components/Admin/ProductTable';
import NewProduct from './components/Admin/NewProduct';
import UpdateProduct from './components/Admin/UpdateProduct';
import UserTable from './components/Admin/UserTable';
import UpdateUser from './components/Admin/UpdateUser';
import ReviewsTable from './components/Admin/ReviewsTable';
import ChatInbox from './components/Admin/ChatInbox';
import CategoryManager from './components/Admin/CategoryManager';
import WebsiteConfig from './components/Admin/WebsiteConfig';
import DatabaseManager from './components/Admin/DatabaseManager';
import More from './components/Admin/More';
import AdminBottomNav from './components/Admin/AdminBottomNav';
import ChatWidget from './components/Chat/ChatWidget';
import Checkout from './components/Store/Checkout';
import TrackOrder from './components/Store/TrackOrder';
import Policy from './components/Policy';
import Wishlist from './components/Wishlist/Wishlist';
import NotFound from './components/NotFound';
import ImageGallery from './components/Gallery/ImageGallery';
import { SiteConfigProvider } from './context/SiteConfigContext';
import MobileTopBar from './components/Layouts/Header/MobileTopBar';

function App() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // Load web fonts once on mount
  useEffect(() => {
    WebFont.load({
      google: {
        families: ["Roboto:300,400,500,600,700"],
      },
    });
  }, []);

  // Load authenticated user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Keep page content clear of fixed top bars
  useEffect(() => {
    const apply = () => {
      const isMobile = window.innerWidth < 768;
      const el = isMobile
        ? document.querySelector('.mobile-topbar')
        : document.querySelector('header');
      document.body.style.paddingTop = el && el.offsetHeight ? `${el.offsetHeight}px` : '';
    };

    apply();
    const t = setTimeout(apply, 300);
    const t2 = setTimeout(apply, 800);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(apply);
      const header = document.querySelector('header');
      const mobileBar = document.querySelector('.mobile-topbar');
      if (header) ro.observe(header);
      if (mobileBar) ro.observe(mobileBar);
      // Re-observe after fonts/layout settle
      const t3 = setTimeout(() => {
        const h = document.querySelector('header');
        const m = document.querySelector('.mobile-topbar');
        if (h) ro.observe(h);
        if (m) ro.observe(m);
      }, 300);
      window.addEventListener('resize', apply);
      return () => {
        clearTimeout(t); clearTimeout(t2); clearTimeout(t3);
        ro.disconnect();
        window.removeEventListener('resize', apply);
        document.body.style.paddingTop = '';
      };
    }

    window.addEventListener('resize', apply);
    return () => {
      clearTimeout(t); clearTimeout(t2);
      window.removeEventListener('resize', apply);
      document.body.style.paddingTop = '';
    };
  }, [pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  // Block right-click and common DevTools shortcuts — registered once on mount
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.keyCode === 123) e.preventDefault(); // F12
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) e.preventDefault(); // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) e.preventDefault(); // Ctrl+Shift+J
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <SiteConfigProvider>
      <Header />
      <MobileTopBar />
      <BottomBar />
      {/* Admin bottom nav — hidden on non-admin pages internally */}
      <AdminBottomNav />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:keyword" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/gallery" element={<ImageGallery />} />

        {/* Auth-only routes */}
        <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
        <Route path="/order/confirm" element={<ProtectedRoute><OrderConfirm /></ProtectedRoute>} />
        <Route path="/process/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/orders/success" element={<OrderSuccess success={true} />} />
        <Route path="/orders/failed" element={<OrderSuccess success={false} />} />
        <Route path="/order/:id" element={<ProtectedRoute><OrderStatus /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/order_details/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/account/update" element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
        <Route path="/password/update" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={0}><MainData /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={1}><Orders /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/order/:id" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={1}><UpdateOrder /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={2}><ProductTable /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/new_product" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={3}><NewProduct /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/product/:id" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={2}><UpdateProduct /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={4}><UserTable /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/user/:id" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={4}><UpdateUser /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={5}><ReviewsTable /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/store_orders" element={<Navigate to="/admin/orders" replace />} />
        <Route path="/admin/homepage" element={<Navigate to="/admin/config" replace />} />
        <Route path="/admin/chat" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={7}><ChatInbox /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={8}><CategoryManager /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/config" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={9}><WebsiteConfig /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/database" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={10}><DatabaseManager /></Dashboard></ProtectedRoute>
        } />
        <Route path="/admin/more" element={
          <ProtectedRoute isAdmin={true}><Dashboard activeTab={-1}><More /></Dashboard></ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <ChatWidget />
    </SiteConfigProvider>
  );
}

export default App;
