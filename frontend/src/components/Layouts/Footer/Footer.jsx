import { useEffect, useState } from 'react';
import WorkIcon from '@mui/icons-material/Work';
import StarsIcon from '@mui/icons-material/Stars';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import HelpIcon from '@mui/icons-material/Help';
import paymentMethods from '../../../assets/images/payment-methods.svg';
import { useLocation } from 'react-router-dom';

const footerLinks = [
  {
    title: "about",
    links: [
      {
        name: "Contact Us",
        redirect: "/track",
      },
      {
        name: "About Us",
        redirect: "/policy",
      },
      {
        name: "Careers",
        redirect: "/policy",
      },
      {
        name: "TechBazar Stories",
        redirect: "/policy",
      },
      {
        name: "Press",
        redirect: "/policy",
      },
      {
        name: "TechBazar Wholesale",
        redirect: "/policy",
      },
      {
        name: "Corporate Information",
        redirect: "/policy",
      },
    ]
  },
  {
    title: "help",
    links: [
      {
        name: "Payments",
        redirect: "/policy",
      },
      {
        name: "Shipping",
        redirect: "/policy",
      },
      {
        name: "Cancellation & Returns",
        redirect: "/policy",
      },
      {
        name: "FAQ",
        redirect: "/policy",
      }
    ]
  },
  {
    title: "policy",
    links: [
      {
        name: "Return Policy",
        redirect: "/policy",
      },
      {
        name: "Terms Of Use",
        redirect: "/policy",
      },
      {
        name: "Security",
        redirect: "/policyecurity",
      },
      {
        name: "Privacy",
        redirect: "/policy",
      },
      {
        name: "Sitemap",
        redirect: "/policy",
      },
      {
        name: "EPR Compliance",
        redirect: "/policy",
      },
    ]
  },
  {
    title: "social",
    links: [
      {
        name: "Facebook",
        redirect: "https://www.facebook.com",
      },
      {
        name: "Twitter",
        redirect: "https://twitter.com",
      },
      {
        name: "YouTube",
        redirect: "https://www.youtube.com",
      }
    ]
  }
]

const Footer = () => {

  const location = useLocation();
  const [adminRoute, setAdminRoute] = useState(false);

  useEffect(() => {
    setAdminRoute(location.pathname.split("/", 2).includes("admin"))
  }, [location]);

  return (
    <>
      {!adminRoute && (
        <>
          <footer className="mt-20 w-full py-1 sm:py-4 px-4 sm:px-12 bg-primary-darkBlue text-white text-xs border-b border-white/10 flex flex-col sm:flex-row overflow-hidden">
            <div className="w-full sm:w-7/12 flex flex-col sm:flex-row">

              {footerLinks.map((el, i) => (
                <div className="w-full sm:w-1/5 flex flex-col gap-2 my-3 sm:my-6 ml-5" key={i}>
                  <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-2">{el.title}</h2>
                  {el.links.map((item, i) => (
                    <a href={item.redirect} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-sm transition" key={i}>{item.name}</a>
                  ))}

                </div>
              ))}

            </div>

            <div className="border-white/10 h-36 w-1 border-l mr-5 mt-6 hidden sm:block"></div>
            <div className="w-full sm:w-5/12 my-6 mx-5 sm:mx-0 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
              <div className="w-full sm:w-1/2">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider">Mail Us:</h2>
                <p className="mt-2 leading-5">TechBazar Internet Private Limited,<br />
                  Buildings Alyssa, Begonia &<br />
                  Clove Embassy Tech Village,<br />
                  Outer Ring Road, Devarabeesanahalli Village,<br />
                  Bengaluru, 560103,<br />
                  Karnataka, India
                </p>
              </div>

              <div className="w-full sm:w-1/2">
                <h2 className="font-display font-bold text-white text-sm uppercase tracking-wider">Registered Office Address:</h2>
                <p className="mt-2 leading-5">TechBazar Internet Private Limited,<br />
                  Buildings Alyssa, Begonia &<br />
                  Clove Embassy Tech Village,<br />
                  Outer Ring Road, Devarabeesanahalli Village,<br />
                  Bengaluru, 560103,<br />
                  Karnataka, India <br />
                  CIN : U51109KA2012PTC066107<br />
                  Telephone: <a className="text-primary-accent hover:text-white transition" href="tel:18002029898">1800 202 9898</a>
                </p>
              </div>
            </div>

          </footer>
          {/* <!-- footer ends --> */}

          <div className="px-16 py-6 w-full bg-primary-darkBlue hidden sm:flex justify-between items-center text-sm text-slate-500">
            <a href="/policy" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
              <span className="text-yellow-400"><WorkIcon sx={{ fontSize: "20px" }} /></span> Sell On TechBazar
            </a>
            <a href="/policy" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
              <span className="text-yellow-400"><StarsIcon sx={{ fontSize: "20px" }} /></span> Advertise
            </a>
            <a href="/policy" rel="noreferrer" target="_blank" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
              <span className="text-yellow-400"><CardGiftcardIcon sx={{ fontSize: "20px" }} /></span> Gift Cards
            </a>
            <a href="/track" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
              <span className="text-yellow-400"><HelpIcon sx={{ fontSize: "20px" }} /></span> Help Center
            </a>

            <span>&copy; 2007-{new Date().getFullYear()} TechBazar.com</span>
            <img draggable="false" src={paymentMethods} alt="Card Payment" />
          </div>
        </>
      )}
    </>
  )
};

export default Footer;
