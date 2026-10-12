import { useEffect, useState } from 'react';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import { categories as fallbackCategories } from '../../utils/constants';

// Horizontal category pill strip under the main navbar (MegaMart layout).
// List is admin-editable from Admin → Homepage → Categories.
const MinCategory = () => {
    const [categories, setCategories] = useState(fallbackCategories);

    useEffect(() => {
        let alive = true;
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                const list = data?.config?.categories;
                if (alive && Array.isArray(list) && list.length) setCategories(list);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    return (
        <div
            className="hidden md:block w-full border-t"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-header)' }}
        >
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                    {categories.map((cat, i) => (
                        <Link
                            to={`/products?category=${encodeURIComponent(cat)}`}
                            key={i}
                            className="flex items-center gap-0.5 shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 border-transparent"
                            style={{ color: 'var(--color-text-secondary)' }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = 'var(--color-accent)';
                                e.currentTarget.style.borderBottomColor = 'var(--color-accent)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderBottomColor = 'transparent';
                            }}
                        >
                            {cat}
                            <ExpandMoreIcon sx={{ fontSize: '16px' }} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MinCategory;
