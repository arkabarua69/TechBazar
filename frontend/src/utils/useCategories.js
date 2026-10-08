import { useEffect, useState } from 'react';
import axios from 'axios';
import { categories as fallbackCategories } from './constants';

// Product categories come from the site CMS (GET /api/v1/siteconfig),
// editable in Admin → Homepage. Falls back to the built-in list when
// the backend is unreachable.
export const useCategories = () => {
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

    return categories;
};

export default useCategories;
