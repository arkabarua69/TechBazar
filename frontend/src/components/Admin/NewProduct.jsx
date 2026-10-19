import TextField from '@mui/material/TextField';
import { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuItem from '@mui/material/MenuItem';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { NEW_PRODUCT_RESET } from '../../constants/productConstants';
import { createProduct, clearErrors } from '../../actions/productAction';
import { useCategories } from '../../utils/useCategories';
import ImgBBUploader from './ImgBBUploader';
import MultiImageUploader from './MultiImageUploader';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { Tag, Layers, Sparkles, Palette, Building2, ListChecks, Images, Save, PackagePlus, Coins } from 'lucide-react';

// App-style grouped card: icon chip + title/hint + fields.
const Section = ({ icon, title, hint, children }) => (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
        <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                {icon}
            </span>
            <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 leading-tight">{title}</h2>
                {hint && <p className="text-[11px] text-gray-400 leading-tight">{hint}</p>}
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const NewProduct = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const categories = useCategories();

    const { loading, success, error } = useSelector((state) => state.newProduct);

    const [highlights, setHighlights] = useState([]);
    const [colors, setColors] = useState("");
    const [sizes, setSizes] = useState("");
    const [inTheBox, setInTheBox] = useState("");
    const [highlightInput, setHighlightInput] = useState("");
    const [specs, setSpecs] = useState([]);
    const [specsInput, setSpecsInput] = useState({
        title: "",
        description: ""
    });

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [cuttedPrice, setCuttedPrice] = useState(0);
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState(0);
    const [warranty, setWarranty] = useState(0);
    const [brand, setBrand] = useState("");
    const [images, setImages] = useState([]);

    const [logo, setLogo] = useState("");

    const handleSpecsChange = (e) => {
        setSpecsInput({ ...specsInput, [e.target.name]: e.target.value });
    }

    const addSpecs = () => {
        if (!specsInput.title.trim() || !specsInput.title.trim()) return;
        setSpecs([...specs, specsInput]);
        setSpecsInput({ title: "", description: "" });
    }

    const addHighlight = () => {
        if (!highlightInput.trim()) return;
        setHighlights([...highlights, highlightInput]);
        setHighlightInput("");
    }

    const deleteHighlight = (index) => {
        setHighlights(highlights.filter((h, i) => i !== index))
    }

    const deleteSpec = (index) => {
        setSpecs(specs.filter((s, i) => i !== index))
    }

    const handleLogoUploaded = (url) => setLogo(url || '');

    const newProductSubmitHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.set("name", name);
        formData.set("description", description);
        formData.set("price", price);
        formData.set("cuttedPrice", cuttedPrice);
        formData.set("category", category);
        formData.set("stock", stock);
        formData.set("warranty", warranty);
        formData.set("brandname", brand);
        formData.set("logo", logo);

        formData.set("images", JSON.stringify(images));

        highlights.forEach((h) => {
            formData.append("highlights", h);
        });

        colors.split(",").forEach((c) => {
            const v = c.trim();
            if (v) formData.append("colors", v);
        });

        sizes.split(",").forEach((s) => {
            const v = s.trim();
            if (v) formData.append("sizes", v);
        });

        inTheBox.split(",").forEach((b) => {
            const v = b.trim();
            if (v) formData.append("inTheBox", v);
        });

        specs.forEach((s) => {
            formData.append("specifications", JSON.stringify(s));
        });

        dispatch(createProduct(formData));
    }

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (success) {
            enqueueSnackbar("Product Created", { variant: "success" });
            dispatch({ type: NEW_PRODUCT_RESET });
            navigate("/admin/products");
        }
    }, [dispatch, error, success, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Admin: New Product" />

            {loading && <BackdropLoader />}
            {/* App-style header */}
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <PackagePlus size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Add New Product</h1>
                    <p className="text-xs text-gray-500">Fill in the details and publish it to your store</p>
                </div>
                <button type="submit" form="mainform" className="hidden sm:inline-flex items-center gap-2 bg-black text-white text-sm font-semibold rounded-full px-4 py-2 hover:bg-gray-800 active:scale-95 transition">
                    <Save size={16} /> Save
                </button>
            </div>

            <form onSubmit={newProductSubmitHandler} encType="multipart/form-data" id="mainform" className="flex flex-col gap-4 pb-24 sm:pb-0">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* ── Left column ── */}
                <div className="flex flex-col gap-4">

                    <Section icon={<Tag size={16} />} title="Basic info" hint="Product name and description">
                    <TextField
                        label="Name"
                        variant="outlined"
                        size="small"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        variant="outlined"
                        size="small"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    </Section>

                    <Section icon={<Coins size={16} />} title="Pricing" hint="Selling price and original price">
                    <div className="grid grid-cols-2 gap-3">
                        <TextField
                            label="Price"
                            type="number"
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{
                                inputProps: {
                                    min: 0
                                }
                            }}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        <TextField
                            label="Cutted Price"
                            type="number"
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{
                                inputProps: {
                                    min: 0
                                }
                            }}
                            value={cuttedPrice}
                            onChange={(e) => setCuttedPrice(e.target.value)}
                        />
                    </div>
                    </Section>

                    <Section icon={<Layers size={16} />} title="Organise" hint="Category, stock and warranty">
                    <TextField
                            label="Category"
                            select
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map((el, i) => (
                                <MenuItem value={el} key={i}>
                                    {el}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Stock"
                            type="number"
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{
                                inputProps: {
                                    min: 0
                                }
                            }}
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                        />
                        <TextField
                            label="Warranty"
                            type="number"
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{
                                inputProps: {
                                    min: 0
                                }
                            }}
                            value={warranty}
                            onChange={(e) => setWarranty(e.target.value)}
                        />
                    </Section>

                    <Section icon={<Sparkles size={16} />} title="Highlights" hint="Key selling points shown on the product page">
                        <div className="flex items-stretch gap-1">
                            <input value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} type="text" placeholder="Highlight" className="px-2 flex-1 outline-none border border-gray-200 rounded-lg sm:rounded-r-none sm:rounded-l-lg" />
                            <span onClick={() => addHighlight()} className="py-2 px-6 bg-black text-white rounded sm:rounded-l-none sm:rounded-r-lg hover:shadow-lg cursor-pointer text-center">Add</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {highlights.map((h, i) => (
                                <div className="flex justify-between rounded items-center py-1 px-2 bg-green-50">
                                    <p className="text-green-800 text-sm font-medium">{h}</p>
                                    <span onClick={() => deleteHighlight(i)} className="text-red-600 hover:bg-red-100 bg-red-100 p-1 rounded-full cursor-pointer">
                                        <DeleteIcon />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<Palette size={16} />} title="Variants & box" hint="Colours and what's inside the box">
                        <div className="flex flex-col gap-3">
                        <TextField
                            label="Colors (comma separated, optional)"
                            type="text"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={colors}
                            onChange={(e) => setColors(e.target.value)}
                            helperText="Shown as color variants on the product page — e.g. Black, Silver"
                        />
                        <TextField
                            label="Sizes (comma separated, optional)"
                            type="text"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            helperText="Shown as size options on the product page — e.g. S, M, L, XL"
                        />
                        <TextField
                            label="In the Box (comma separated, optional)"
                            type="text"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={inTheBox}
                            onChange={(e) => setInTheBox(e.target.value)}
                            helperText="Shown in the In the Box tab — e.g. Charger, USB Cable, Warranty Card"
                        />
                    </div>
                    </Section>

                    <Section icon={<Building2 size={16} />} title="Brand" hint="Brand name and logo">
                    <div className="flex flex-col gap-3">
                        <TextField
                            label="Brand"
                            type="text"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                        <ImgBBUploader
                            label="Brand Logo"
                            currentUrl={logo}
                            onUploaded={handleLogoUploaded}
                            previewClass="max-h-16 max-w-full object-contain"
                        />
                    </div>
                    </Section>

                </div>

                {/* ── Right column ── */}
                <div className="flex flex-col gap-4">

                    <Section icon={<ListChecks size={16} />} title="Specifications" hint="Model numbers and technical specs">

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <TextField value={specsInput.title} onChange={handleSpecsChange} name="title" label="Name" placeholder="Model No" variant="outlined" size="small" fullWidth />
                        <TextField value={specsInput.description} onChange={handleSpecsChange} name="description" label="Description" placeholder="WJDK42DF5" variant="outlined" size="small" fullWidth />
                        <span onClick={() => addSpecs()} className="py-2 px-6 bg-black text-white rounded hover:shadow-lg cursor-pointer shrink-0">Add</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {specs.map((spec, i) => (
                            <div className="flex justify-between items-center text-sm rounded bg-gray-100 py-1 px-2">
                                <p className="text-gray-500 font-medium">{spec.title}</p>
                                <p>{spec.description}</p>
                                <span onClick={() => deleteSpec(i)} className="text-red-600 hover:bg-red-200 bg-red-100 p-1 rounded-full cursor-pointer">
                                    <DeleteIcon />
                                </span>
                            </div>
                        ))}
                    </div>
                    </Section>

                    <Section icon={<Images size={16} />} title="Product images" hint="Upload up to 8 photos">
                    <MultiImageUploader label="Product Images" value={images} onChange={setImages} max={8} />
                    </Section>

                    <div className="hidden sm:flex justify-end">
                        <input form="mainform" type="submit" className="bg-black px-8 py-3 text-white font-semibold rounded-xl shadow hover:shadow-lg cursor-pointer active:scale-[0.98] transition" value="Publish product" />
                    </div>

                </div>
                </div>

            </form>

            {/* Sticky mobile save bar — sits just above the admin bottom nav */}
            <div
                className="sm:hidden fixed left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.05)]"
                style={{ bottom: 'calc(52px + env(safe-area-inset-bottom))' }}
            >
                <button type="submit" form="mainform" className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold rounded-xl py-3 active:scale-[0.99] transition">
                    <Save size={18} /> Publish product
                </button>
            </div>
        </>
    );
};

export default NewProduct;
