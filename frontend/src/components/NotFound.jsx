import notFound from '../assets/images/404-not-found.svg';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="w-full sm:w-11/12 mx-auto flex flex-col items-center gap-4 py-16">
            <img draggable="false" className="sm:w-1/3 h-full" src={notFound} alt="Page Not Found" />
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Page Not Found</h1>
            <Link to="/" className="btn-accent rounded-lg uppercase text-sm">Back To Home</Link>
        </div>
    );
};

export default NotFound;
