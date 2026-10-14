import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    CircularProgress, Tooltip, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, Pagination,
    InputAdornment,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableRowsIcon from '@mui/icons-material/TableRows';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sz = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sz[i];
};

const pill = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold';

/* ─── Create-collection modal ──────────────────────────────── */
const CreateCollectionModal = ({ open, onClose, onCreated }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const { data } = await axios.post('/api/v1/admin/database/collections', { name: name.trim() });
            enqueueSnackbar(data.message, { variant: 'success' });
            setName('');
            onCreated();
            onClose();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to create collection', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold text-gray-800">Create New Collection</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label="Collection Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    helperText="Letters, digits and underscores only. Cannot start with a digit."
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleCreate} variant="contained" disabled={loading || !name.trim()}
                    sx={{ backgroundColor: '#E84B0F', '&:hover': { backgroundColor: '#C63E0A' } }}>
                    {loading ? <CircularProgress size={16} color="inherit" /> : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/* ─── Edit-document modal ──────────────────────────────────── */
const EditDocModal = ({ open, doc, collection, onClose, onSaved }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (doc) {
            setText(JSON.stringify(doc, null, 2));
            setError('');
        }
    }, [doc]);

    const handleSave = async () => {
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            setError('Invalid JSON — fix the syntax before saving.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.put(
                `/api/v1/admin/database/collections/${collection}/${doc._id}`,
                parsed
            );
            enqueueSnackbar('Document updated', { variant: 'success' });
            onSaved(data.doc);
            onClose();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Update failed', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className="font-semibold text-gray-800">
                Edit Document <span className="text-xs font-normal text-gray-400 ml-2">({collection})</span>
            </DialogTitle>
            <DialogContent>
                <p className="text-xs text-gray-400 mb-2">Edit JSON directly. The <code>_id</code> field will be ignored on save.</p>
                <TextField
                    fullWidth multiline rows={18}
                    value={text}
                    onChange={e => { setText(e.target.value); setError(''); }}
                    inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
                    error={!!error}
                    helperText={error}
                    sx={{ mt: 0.5 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}
                    sx={{ backgroundColor: '#E84B0F', '&:hover': { backgroundColor: '#C63E0A' } }}>
                    {loading ? <CircularProgress size={16} color="inherit" /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/* ─── Delete-document confirm modal ───────────────────────── */
const DeleteDocModal = ({ open, doc, collection, onClose, onDeleted }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(`/api/v1/admin/database/collections/${collection}/${doc._id}`);
            enqueueSnackbar('Document deleted', { variant: 'success' });
            onDeleted(doc._id);
            onClose();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Delete failed', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle className="font-semibold text-red-600">Delete Document?</DialogTitle>
            <DialogContent>
                <p className="text-sm text-gray-600">
                    This will permanently remove the document with <code className="bg-gray-100 px-1 rounded">_id: {doc?._id}</code> from <strong>{collection}</strong>. This cannot be undone.
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
                    {loading ? <CircularProgress size={16} color="inherit" /> : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

/* ─── Collection-list view ─────────────────────────────────── */
const CollectionList = ({ onSelect, onCreateClick }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/v1/admin/database/collections');
            setCollections(data.collections);
        } catch {
            enqueueSnackbar('Failed to load collections', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => { load(); }, [load]);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <StorageIcon sx={{ color: '#E84B0F', fontSize: 22 }} />
                    <h1 className="text-lg font-bold text-gray-800">Database Collections</h1>
                    <span className={`${pill} bg-orange-50 text-orange-600 border border-orange-200 ml-1`}>
                        {collections.length} collections
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={load}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2">
                        <RefreshIcon sx={{ fontSize: 15 }} /> Refresh
                    </button>
                    <button onClick={onCreateClick}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3 py-2"
                        style={{ backgroundColor: '#E84B0F' }}>
                        <AddIcon sx={{ fontSize: 15 }} /> New Collection
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <CircularProgress size={20} /> Loading collections…
                </div>
            ) : collections.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <StorageIcon sx={{ fontSize: 48, opacity: 0.2 }} />
                    <p className="mt-2 text-sm">No collections found</p>
                </div>
            ) : (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid #f3e8e0', borderRadius: '1rem', overflow: 'hidden' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fdf6f2' }}>
                                {['Collection Name', 'Documents', 'Data Size', 'Storage', 'Indexes', ''].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: '#7A5C48', borderBottom: '1px solid #f3e8e0' }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {collections.map((col) => (
                                <TableRow key={col.name} hover
                                    sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer', transition: 'background .15s' }}
                                    onClick={() => onSelect(col.name)}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <TableRowsIcon sx={{ fontSize: 14, color: '#E84B0F' }} />
                                            <span className="font-semibold text-gray-800 text-sm">{col.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={col.count.toLocaleString()} size="small"
                                            sx={{ backgroundColor: '#fdf6f2', color: '#E84B0F', fontWeight: 700, fontSize: 11, border: '1px solid #f3e8e0' }} />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 12, color: '#7A5C48' }}>{fmt(col.size)}</TableCell>
                                    <TableCell sx={{ fontSize: 12, color: '#7A5C48' }}>{fmt(col.storageSize)}</TableCell>
                                    <TableCell sx={{ fontSize: 12, color: '#7A5C48' }}>{col.indexes}</TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <button onClick={e => { e.stopPropagation(); onSelect(col.name); }}
                                            className="text-xs font-medium text-orange-500 hover:text-orange-700 hover:underline">
                                            Browse →
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </div>
    );
};

/* ─── Document-browser view ───────────────────────────────── */
const DocumentBrowser = ({ collectionName, onBack }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [docs, setDocs] = useState([]);
    const [fields, setFields] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [editDoc, setEditDoc] = useState(null);
    const [deleteDoc, setDeleteDoc] = useState(null);

    const LIMIT = 20;

    const load = useCallback(async (pg = 1, q = '') => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `/api/v1/admin/database/collections/${collectionName}`,
                { params: { page: pg, limit: LIMIT, search: q } }
            );
            setDocs(data.docs);
            setFields(data.fields);
            setTotal(data.total);
            setPages(data.pages);
            setPage(pg);
        } catch {
            enqueueSnackbar('Failed to load documents', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [collectionName, enqueueSnackbar]);

    useEffect(() => { load(1, ''); }, [load]);

    const handleSearch = () => { setSearch(searchInput); load(1, searchInput); };
    const handlePageChange = (_, val) => load(val, search);

    const handleSaved = (updated) => {
        setDocs(prev => prev.map(d => d._id === updated._id ? updated : d));
    };
    const handleDeleted = (id) => {
        setDocs(prev => prev.filter(d => d._id !== id));
        setTotal(t => t - 1);
    };

    // Display columns: _id first, then remaining fields (capped at 6 total)
    const displayFields = ['_id', ...fields.filter(f => f !== '_id')].slice(0, 6);

    const cellVal = (doc, field) => {
        const v = doc[field];
        if (v === null || v === undefined) return <span className="text-gray-300 italic text-xs">null</span>;
        if (typeof v === 'object') return <span className="text-xs font-mono text-gray-400">{JSON.stringify(v).slice(0, 60)}{JSON.stringify(v).length > 60 ? '…' : ''}</span>;
        const str = String(v);
        return <span className="text-sm text-gray-700">{str.length > 60 ? str.slice(0, 60) + '…' : str}</span>;
    };

    return (
        <div>
            {/* Edit modal */}
            <EditDocModal open={!!editDoc} doc={editDoc} collection={collectionName}
                onClose={() => setEditDoc(null)} onSaved={handleSaved} />
            {/* Delete modal */}
            <DeleteDocModal open={!!deleteDoc} doc={deleteDoc} collection={collectionName}
                onClose={() => setDeleteDoc(null)} onDeleted={handleDeleted} />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-3 py-2">
                    <ArrowBackIcon sx={{ fontSize: 16 }} /> Collections
                </button>
                <div className="flex items-center gap-2">
                    <TableRowsIcon sx={{ color: '#E84B0F', fontSize: 18 }} />
                    <h1 className="text-base font-bold text-gray-800">{collectionName}</h1>
                    <span className={`${pill} bg-orange-50 text-orange-600 border border-orange-200`}>
                        {total.toLocaleString()} docs
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
                <TextField
                    size="small" placeholder="Search by _id or keyword…"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#B8937A' }} /></InputAdornment>,
                    }}
                    sx={{ flex: 1, maxWidth: 440, '& .MuiOutlinedInput-root': { borderRadius: '0.75rem' } }}
                />
                <button onClick={handleSearch}
                    className="text-sm font-semibold text-white rounded-xl px-4 py-2"
                    style={{ backgroundColor: '#E84B0F' }}>
                    Search
                </button>
                <button onClick={() => { setSearchInput(''); setSearch(''); load(1, ''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2">
                    Clear
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <CircularProgress size={20} /> Loading documents…
                </div>
            ) : docs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <TableRowsIcon sx={{ fontSize: 48, opacity: 0.2 }} />
                    <p className="mt-2 text-sm">No documents found</p>
                </div>
            ) : (
                <>
                    <TableContainer component={Paper} elevation={0}
                        sx={{ border: '1px solid #f3e8e0', borderRadius: '1rem', overflow: 'hidden', mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#fdf6f2' }}>
                                    {displayFields.map(f => (
                                        <TableCell key={f}
                                            sx={{ fontWeight: 700, fontSize: 11, color: '#7A5C48', borderBottom: '1px solid #f3e8e0', fontFamily: 'monospace' }}>
                                            {f}
                                        </TableCell>
                                    ))}
                                    {fields.length > 6 && (
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#B8937A', borderBottom: '1px solid #f3e8e0' }}>
                                            +{fields.length - 6} more
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#7A5C48', borderBottom: '1px solid #f3e8e0', textAlign: 'right' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {docs.map((doc) => (
                                    <TableRow key={doc._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        {displayFields.map(f => (
                                            <TableCell key={f} sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #fdf6f2' }}>
                                                {cellVal(doc, f)}
                                            </TableCell>
                                        ))}
                                        {fields.length > 6 && <TableCell sx={{ borderBottom: '1px solid #fdf6f2' }} />}
                                        <TableCell sx={{ textAlign: 'right', borderBottom: '1px solid #fdf6f2' }}>
                                            <Tooltip title="Edit document">
                                                <IconButton size="small" onClick={() => setEditDoc(doc)}
                                                    sx={{ color: '#E84B0F', '&:hover': { backgroundColor: 'rgba(232,75,15,0.08)' } }}>
                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete document">
                                                <IconButton size="small" onClick={() => setDeleteDoc(doc)}
                                                    sx={{ color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}>
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex justify-center">
                            <Pagination count={pages} page={page} onChange={handlePageChange}
                                sx={{
                                    '& .MuiPaginationItem-root': { borderRadius: '0.6rem' },
                                    '& .Mui-selected': { backgroundColor: '#E84B0F !important', color: '#fff' },
                                }} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/* ─── Main DatabaseManager page ───────────────────────────── */
const DatabaseManager = () => {
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreated = () => setRefreshKey(k => k + 1);

    return (
        <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#FAE5D3' }}>
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-7"
                    style={{ border: '1px solid rgba(232,75,15,0.12)' }}>

                    <CreateCollectionModal
                        open={createOpen}
                        onClose={() => setCreateOpen(false)}
                        onCreated={handleCreated}
                    />

                    {selectedCollection ? (
                        <DocumentBrowser
                            key={selectedCollection}
                            collectionName={selectedCollection}
                            onBack={() => setSelectedCollection(null)}
                        />
                    ) : (
                        <CollectionList
                            key={refreshKey}
                            onSelect={setSelectedCollection}
                            onCreateClick={() => setCreateOpen(true)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseManager;
