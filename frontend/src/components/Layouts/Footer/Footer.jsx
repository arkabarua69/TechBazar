import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkIcon from '@mui/icons-material/Work';
import StarsIcon from '@mui/icons-material/Stars';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import HelpIcon from '@mui/icons-material/Help';
import paymentMethods from '../../../assets/images/payment-methods.svg';
import { useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../../utils/siteConfig';

// shortcut-strip icon registry (Admin → Homepage → Branding & Content)
const SHORTCUT_ICONS = {
    Work: WorkIcon,
    Stars: StarsIcon,
    CardGiftcard: CardGiftcardIcon,
    Help: HelpIcon,
};

// Footer link row: internal routes use SPA <Link>, external URLs open in a new tab
const FooterLink = ({ item }) =>
  item.internal ? (
    <Link to={item.redirect} className="text-slate-400 hover:text-white text-sm transition">{item.name}</Link>
  ) : (
    <a href={item.redirect} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-sm transition">{item.name}</a>
  );

// multi-line address blocks keep their <br/> structure
const Address = ({ text }) => (
  <p className="mt-2 leading-5">
    {String(text || '').split('\n').map((line, i) => (
      <span key={i}>{line}<br /></span>
    ))}
  </p>
);

const Footer = () => {

  const location = useLocation();
  const [adminRoute, setAdminRoute] = useState(false);

  // footer columns, company block, shortcuts & copyright (Admin → Homepage)
  const { config } = useSiteConfig();
  const footer = config.content?.footer || DEFAULT_SITE_CONFIG.content.footer;
  const columns = footer.columns || [];
  const company = footer.company || {};
  const shortcuts = footer.shortcuts || [];
  const copyright = footer.copyright || 'TechBazar.com';
  const since = footer.since || 2007;

  useEffect(() => {
    setAdminRoute(location.pathname.split("/", 2).includes("admin"))
  }, [location]);

  return (
    <>
      {!adminRoute && (
        <>
          <footer className="mt-20 w-full py-1 sm:py-4 px-4 sm:px-12 bg-primary-darkBlue text-white text-xs border-b border-white/10 flex flex-col sm:flex-row overflow-hidden">
            {/* link groups — 2 columns on mobile, 5 across on desktop */}
            <div className="w-full sm:w-7/12 flex flex-wrap sm:flex-nowrap">

              {columns.map((el, i) => (
                <div className="w-1/2 sm:w-1/5 flex flex-col gap-2 my-3 sm:my-6 sm:ml-5" key={i}>
                  <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-2">{el.title}</h2>
                  {(el.links || []).map((item, i) => (
                    <FooterLink item={item} key={i} />
                  ))}

                </div>
              ))}

            </div>

            <div className="border-white/10 h-36 w-1 border-l mr-5 mt-6 hidden sm:block"></div>
            <div className="w-full sm:w-5/12 my-6 mx-5 sm:mx-0 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
              <div className="w-full sm:w-1/2">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider">Mail Us:</h2>
                <Address text={company.mailUs} />
              </div>

              <div className="w-full sm:w-1/2">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider">Registered Office Address:</h2>
                <Address text={company.registered} />
                {company.cin ? <span>{company.cin}<br /></span> : null}
                {company.telephone ? (
                  <span>Telephone: <a className="text-primary-accent hover:text-white transition" href={`tel:${company.telephone}`}>{company.telephone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')}</a></span>
                ) : null}
              </div>
            </div>

          </footer>
          {/* <!-- footer ends --> -->

          {/* utility strip — visible on every screen size (wraps on mobile) */}
          <div className="px-4 sm:px-16 py-6 w-full bg-primary-darkBlue flex flex-wrap justify-between items-center gap-3 text-sm text-slate-500">
            {shortcuts.map((s, i) => {
              const ShortcutIcon = SHORTCUT_ICONS[s.icon] || WorkIcon;
              const inner = (
                <>
                  <span className="text-yellow-400"><ShortcutIcon sx={{ fontSize: "20px" }} /></span> {s.label}
                </>
              );
              return s.href && s.href.startsWith('/') ? (
                <Link key={i} to={s.href} className="flex items-center gap-2 text-slate-400 hover:text-white transition">{inner}</Link>
              ) : (
                <a key={i} href={s.href || '/policy'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">{inner}</a>
              );
            })}

            <span>&copy; {since}-{new Date().getFullYear()} {copyright}</span>
            <img draggable="false" src={paymentMethods} alt="Card Payment" />
          </div>
        </>
      )}
    </>
  )
};

export default Footer;
