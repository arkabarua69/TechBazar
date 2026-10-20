import TextField from '@mui/material/TextField';
import { useState, useEffect, useRef } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuItem from '@mui/material/MenuItem';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import { REMOVE_PRODUCT_DETAILS, UPDATE_PRODUCT_RESET } from '../../constants/productConstants';
import { clearErrors, getProductDetails, updateProduct } from '../../actions/productAction';
import ImgBBUploader from './ImgBBUploader';
import MultiImageUploader from './MultiImageUploader';
import RichTextEditor from './RichTextEditor';
import BackdropLoader from '../Layouts/BackdropLoader';
import { useCategories } from '../../utils/useCategories';
import MetaData from '../Layouts/MetaData';

const UpdateProduct = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const params = useParams();
    const categories = useCategories();

    const { loading, product, error } = useSelector((state) => state.productDetails);
    const { loading: updateLoading, isUpdated, error: updateError } = useSelector((state) => state.product);

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

    // Snapshot of the loaded product — the submit handler compares against it
    // to send only the fields the admin actually changed.
    const productRef = useRef(null);

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

        // Every field is optional. Only send what the admin actually filled
        // in / changed so untouched fields keep their existing values
        // (empty inputs must never blank out stored data).
        const formData = new FormData();

        const changed = (next, current) => String(next ?? '').trim() !== String(current ?? '').trim();

        // Rich text is normalised to <p>…</p> by the editor, so compare the
        // visible text — otherwise a plain-text description reads as "changed"
        // on every save.
        const textOf = (v) => String(v || '')
            .replace(/<\/p>\s*<p>/gi, ' ')
            .replace(/<\s*br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/\s+/g, ' ')
            .trim();

        // Loaded specs carry a Mongo `_id`; ignore it when diffing so an
        // untouched list isn't mistaken for a change.
        const stripId = ({ title, description } = {}) => ({ title: title || '', description: description || '' });

        const product = productRef.current;

        if (changed(name, product?.name)) formData.set("name", name);
        if (textOf(description) !== textOf(product?.description)) formData.set("description", description);
        if (changed(price, product?.price)) formData.set("price", price);
        if (changed(cuttedPrice, product?.cuttedPrice)) formData.set("cuttedPrice", cuttedPrice);
        if (changed(category, product?.category)) formData.set("category", category);
        if (changed(stock, product?.stock)) formData.set("stock", stock);
        if (changed(warranty, product?.warranty)) formData.set("warranty", warranty);
        if (changed(brand, product?.brand?.name)) formData.set("brandname", brand);
        if (logo && logo !== product?.brand?.logo?.url) formData.set("logo", logo);

        // Images: send the full list only when it actually differs from what
        // the product currently has (so an untouched form is a no-op).
        const currentImages = (product?.images || []).map((img) => img.url).filter(Boolean);
        const imagesChanged = images.length !== currentImages.length || images.some((v, i) => v !== currentImages[i]);
        if (imagesChanged) formData.set("images", JSON.stringify(images));

        // List fields: only include when the admin touched them.
        if (JSON.stringify(highlights) !== JSON.stringify(product?.highlights || [])) {
            highlights.forEach((h) => formData.append("highlights", h));
        }

        const parseList = (value) => value.split(",").map((v) => v.trim()).filter(Boolean);
        if (JSON.stringify(parseList(colors)) !== JSON.stringify(product?.colors || [])) {
            parseList(colors).forEach((c) => formData.append("colors", c));
        }
        if (JSON.stringify(parseList(sizes)) !== JSON.stringify(product?.sizes || [])) {
            parseList(sizes).forEach((s) => formData.append("sizes", s));
        }
        if (JSON.stringify(parseList(inTheBox)) !== JSON.stringify(product?.inTheBox || [])) {
            parseList(inTheBox).forEach((b) => formData.append("inTheBox", b));
        }

        if (JSON.stringify(specs.map(stripId)) !== JSON.stringify((product?.specifications || []).map(stripId))) {
            specs.forEach((s) => formData.append("specifications", JSON.stringify(s)));
        }

        dispatch(updateProduct(params.id, formData));
    }

    const productId = params.id;

    // The product object we last hydrated the form from. Because Redux hands
    // out a new object only when the product is (re)fetched, comparing by
    // reference lets us refill the form after a refetch without clobbering
    // the admin's in-progress edits on ordinary re-renders.
    const hydratedIdRef = useRef(null);

    useEffect(() => {
        const loaded = product && product._id === productId;

        if (!loaded) {
            dispatch(getProductDetails(productId));
        } else if (hydratedIdRef.current !== product) {
            // Hydrate whenever a *new* product object arrives (not merely a
            // re-render), so a refetch after an update still fills the form.
            hydratedIdRef.current = product;
            productRef.current = product;
            setName(product.name ?? "");
            setDescription(product.description ?? "");
            setPrice(product.price ?? 0);
            setCuttedPrice(product.cuttedPrice ?? 0);
            setCategory(product.category ?? "");
            setStock(product.stock ?? 0);
            setWarranty(product.warranty ?? 0);
            setBrand(product.brand?.name ?? "");
            setHighlights(product.highlights || []);
            setSpecs(product.specifications || []);
            setColors(product.colors?.join(", ") || "");
            setSizes(product.sizes?.join(", ") || "");
            setInTheBox(product.inTheBox?.join(", ") || "");
            // Existing images (hosted URLs) pre-filled so they're kept unless removed.
            setImages((product.images || []).map((img) => img.url).filter(Boolean));
            setLogo(product.brand?.logo?.url || "");
        }
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (updateError) {
            enqueueSnackbar(updateError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            enqueueSnackbar("Product Updated Successfully", { variant: "success" });
            dispatch({ type: UPDATE_PRODUCT_RESET });
            dispatch({ type: REMOVE_PRODUCT_DETAILS });
            navigate('/admin/products');
        }
    }, [dispatch, error, updateError, isUpdated, productId, product, navigate, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Admin: Update Product" />

            {loading && <BackdropLoader />}
            {updateLoading && <BackdropLoader />}
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Update Product</h1>
            <form onSubmit={newProductSubmitHandler} encType="multipart/form-data" className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6" id="mainform">

                <div className="flex flex-col gap-3 m-2 sm:w-1/2">
                    <TextField
                        label="Name"
                        variant="outlined"
                        size="small"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <RichTextEditor
                        label="Description"
                        value={description}
                        onChange={setDescription}
                        placeholder="Describe the product…"
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
                                    <span onClick={() => deleteHighlight(i)} className="text-red-600 hover:bg-red-100 p-1 rounded-full cursor-pointer">
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
                        <input form="mainform" type="submit" className="bg-black w-full sm:w-1/3 p-3 text-white font-semibold rounded-xl shadow hover:shadow-lg cursor-pointer active:scale-[0.98] transition" value="Update" />
                    </div>

                </div>

            </form>
        </>
    );
};

export default UpdateProduct;