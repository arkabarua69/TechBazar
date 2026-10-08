import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Searchbar = () => {

    const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if(keyword.trim()){
            navigate(`/products/${keyword}`)
        } else {
            navigate('/products');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full px-3 py-2 flex justify-between items-center bg-cloud border border-line rounded-xl focus-within:border-primary-accent focus-within:bg-white transition">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="text-sm flex-1 outline-none border-none placeholder-slate-500" type="text" placeholder="Search for products, brands and more" />
            <button type="submit" className="text-primary-accent"><SearchIcon /></button>
        </form>
    );
};

export default Searchbar;
