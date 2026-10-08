import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';

const categories = [
    "Electronics",
    "TVs & Appliances",
    "Men",
    "Women",
    "Baby & Kids",
    "Home & Furniture",
    "Sports, Books & More",
    "Flights",
    "Offer Zone",
    "Grocery",
]

const MinCategory = () => {
    return (
        <section className="hidden sm:block bg-white border-b border-line w-full px-2 sm:px-12 overflow-hidden">
            <div className="flex items-center justify-between p-0.5">
                {categories.map((el, i) => (
                    <Link to="/products" key={i} className="text-sm p-2 text-slate-600 font-medium hover:text-primary-accent flex items-center gap-0.5 group">{el} <span className="text-slate-400 group-hover:text-primary-accent"><ExpandMoreIcon sx={{ fontSize: "16px" }} /></span></Link>
                ))}
            </div>
        </section>
    );
};

export default MinCategory;
