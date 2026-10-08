import NotificationsIcon from '@mui/icons-material/Notifications';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DownloadIcon from '@mui/icons-material/Download';

const SecondaryDropDownMenu = () => {

    const navs = [
        {
            title: "Notification Preferences",
            icon: <NotificationsIcon sx={{ fontSize: "18px" }} />,
            redirect: "/policy",
        },
        {
            title: "Sell on TechBazar",
            icon: <BusinessCenterIcon sx={{ fontSize: "18px" }} />,
            redirect: "/policy",
        },
        {
            title: "24x7 Customer Care",
            icon: <LiveHelpIcon sx={{ fontSize: "18px" }} />,
            redirect: "/track",
        },
        {
            title: "Advertise",
            icon: <TrendingUpIcon sx={{ fontSize: "18px" }} />,
            redirect: "/policy",
        },
        {
            title: "Download App",
            icon: <DownloadIcon sx={{ fontSize: "18px" }} />,
            redirect: "/track",
        },
    ]

    return (
        <div className="absolute w-60 -right-2 top-9 surface rounded-xl shadow-lg flex-col text-sm overflow-hidden">

            {navs.map((item, i) => {

                const { title, icon, redirect } = item;

                return (
                    <a className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent" href={redirect} key={i}>
                        <span className="text-primary-accent">{icon}</span>
                        {title}
                    </a>
                )
            })}

            <div className="absolute right-1/2 -top-2.5">
                <div className="arrow_down"></div>
            </div>
        </div>
    );
};

export default SecondaryDropDownMenu;
