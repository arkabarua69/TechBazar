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

const NewProduct = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const categories = useCategories();

    const { loading, success, error } = useSelector((state) => state.newProduct);

    const [highlights, setHighlights] = useState([]);
    const [colors, setColors] = useState("");
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
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Add New Product</h1>
            <form onSubmit={newProductSubmitHandler} encType="multipart/form-data" className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6" id="mainform">

                <div className="flex flex-col gap-3 m-2 sm:w-1/2">
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
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
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
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
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
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row items-stretch gap-1">
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
                    </div>

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

                    <h2 className="font-semibold text-gray-900">Brand Details</h2>
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

                </div>

                <div className="flex flex-col gap-2 m-2 sm:w-1/2">
                    <h2 className="font-semibold text-gray-900">Specifications</h2>

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

                    <h2 className="font-semibold text-gray-900">Product Images</h2>
                    <MultiImageUploader label="Product Images" value={images} onChange={setImages} max={8} />

                    <div className="flex justify-end">
                        <input form="mainform" type="submit" className="bg-black w-full sm:w-1/3 p-3 text-white font-semibold rounded-xl shadow hover:shadow-lg cursor-pointer active:scale-[0.98] transition" value="Submit" />
                    </div>

                </div>

            </form>
        </>
    );
};

export default NewProduct;
