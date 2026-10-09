import { useEffect, useState } from 'react';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import { categories as fallbackCategories } from '../../utils/constants';

// Top category strip — the list comes from the site CMS
// (GET /api/v1/siteconfig), editable in Admin → Homepage.
const MinCategory = () => {
    const [categories, setCategories] = useState(fallbackCategories);

    useEffect(() => {
        let alive = true;
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                const list = data && data.config && data.config.categories;
                if (alive && Array.isArray(list) && list.length) {
                    setCategories(list);
                }
            })
            .catch(() => { /* keep fallback */ });
        return () => { alive = false; };
    }, []);

    return (
        <section className="hidden sm:block bg-white border-b border-line w-full px-2 sm:px-12 overflow-hidden">
            <div className="flex items-center justify-between p-0.5">
                {categories.map((el, i) => (
                    <Link to={`/products?category=${encodeURIComponent(el)}`} key={i} className="text-sm p-2 text-slate-600 font-medium hover:text-primary-accent flex items-center gap-0.5 group">{el} <span className="text-slate-400 group-hover:text-primary-accent"><ExpandMoreIcon sx={{ fontSize: "16px" }} /></span></Link>
                ))}
            </div>
        </section>
    );
};

export default MinCategory;
