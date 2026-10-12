import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Searchbar = () => {
    const [keyword, setKeyword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/products/${keyword}`);
        } else {
            navigate('/products');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full flex items-center overflow-hidden rounded-xl transition-all duration-200"
            style={{
                background: '#FFF8F5',
                border: '1.5px solid var(--color-border)',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
            <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
                style={{ color: 'var(--color-text-primary)' }}
                type="text"
                placeholder="Search for products, brands and more..."
            />
            <button
                type="submit"
                className="h-full px-4 py-2.5 flex items-center justify-center text-white font-semibold text-sm rounded-r-xl transition-all duration-200"
                style={{ backgroundColor: 'var(--color-accent)', minWidth: '48px' }}
            >
                <SearchIcon sx={{ fontSize: '20px' }} />
            </button>
        </form>
    );
};

export default Searchbar;
