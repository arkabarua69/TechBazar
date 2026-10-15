import { Link } from 'react-router-dom';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import MetaData from './Layouts/MetaData';

const NotFound = () => (
    <>
        <MetaData title="Page Not Found" />
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
            style={{ backgroundColor: 'var(--color-bg)' }}
        >
            {/* Large 404 */}
            <div className="relative mb-6">
                <span
                    className="font-bold select-none"
                    style={{
                        fontSize: 'clamp(5rem, 20vw, 10rem)',
                        color: 'var(--color-border)',
                        lineHeight: 1,
                    }}
                >
                    404
                </span>
                <span
                    className="absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                >
                    <SentimentDissatisfiedIcon sx={{ fontSize: { xs: '3rem', sm: '4.5rem' }, color: 'var(--color-text-muted)' }} />
                </span>
            </div>

            <h1
                className="font-bold text-2xl sm:text-3xl mb-2"
                style={{ color: 'var(--color-text-primary)' }}
            >
                Page Not Found
            </h1>
            <p
                className="text-sm sm:text-base mb-8 max-w-md"
                style={{ color: 'var(--color-text-secondary)' }}
            >
                The page you're looking for doesn't exist or has been moved.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/" className="btn-accent px-6 py-3 text-sm">
                    Go Home
                </Link>
                <Link to="/products" className="btn-ghost px-6 py-3 text-sm">
                    Browse Products
                </Link>
            </div>
        </div>
    </>
);

export default NotFound;
