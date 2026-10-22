import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    CircularProgress, Tooltip, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Database, Table2, HardDrive, Layers, RefreshCw, Plus, ChevronRight, ArrowLeft, Search, Pencil, Trash2 } from 'lucide-react';
import MetaData from '../Layouts/MetaData';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sz = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sz[i];
};

// KPI tile used in the stats strip.
const Stat = ({ icon, label, value, tone }) => {
    const tones = {
        orange: 'bg-[#E84B0F]/10 text-[#E84B0F]',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-lg font-extrabold text-gray-900 leading-none truncate">{value}</p>
                <p className="text-[11px] text-gray-500 truncate">{label}</p>
            </div>
        </div>
    );
};

// Plain-text preview of a document field (for the mobile cards).
const cellText = (doc, field) => {
    const v = doc[field];
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'object') {
        const s = JSON.stringify(v);
        return s.length > 60 ? s.slice(0, 60) + '…' : s;
    }
    const s = String(v);
    return s.length > 90 ? s.slice(0, 90) + '…' : s;
};

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
                    sx={{ backgroundColor: 'var(--color-accent)', '&:hover': { backgroundColor: 'var(--color-accent-hover)' } }}>
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
                    sx={{ backgroundColor: 'var(--color-accent)', '&:hover': { backgroundColor: 'var(--color-accent-hover)' } }}>
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

    const totalDocs = collections.reduce((s, c) => s + (c.count || 0), 0);
    const totalSize = collections.reduce((s, c) => s + (c.size || 0), 0);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <Database size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Database</h1>
                    <p className="text-xs text-gray-500">
                        {collections.length} collection{collections.length === 1 ? '' : 's'} · {totalDocs.toLocaleString()} documents
                    </p>
                </div>
                <button onClick={load} aria-label="Refresh"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-semibold border border-gray-300 bg-white rounded-full px-3.5 py-2 text-gray-700 hover:bg-gray-100 shrink-0">
                    <RefreshCw size={15} /> Refresh
                </button>
                <button onClick={onCreateClick}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-full px-3.5 py-2 shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)' }}>
                    <Plus size={15} /> <span className="hidden sm:inline">New Collection</span><span className="sm:hidden">New</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Stat icon={<Layers size={16} />} label="Collections" value={collections.length} tone="orange" />
                <Stat icon={<Table2 size={16} />} label="Documents" value={totalDocs.toLocaleString()} tone="blue" />
                <Stat icon={<HardDrive size={16} />} label="Data size" value={fmt(totalSize)} tone="green" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <CircularProgress size={20} /> Loading collections…
                </div>
            ) : collections.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Database size={44} className="mx-auto text-gray-200" />
                    <p className="mt-2 text-sm">No collections found</p>
                </div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="sm:hidden flex flex-col gap-3">
                        {collections.map((col) => (
                            <button key={col.name} onClick={() => onSelect(col.name)}
                                className="text-left bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-3 active:scale-[0.99] transition">
                                <span className="w-10 h-10 rounded-xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                                    <Table2 size={18} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-bold text-sm text-gray-900 truncate">{col.name}</span>
                                    <span className="block text-xs text-gray-500">{col.count.toLocaleString()} docs · {fmt(col.size)}</span>
                                </span>
                                <ChevronRight size={18} className="text-gray-300 shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block">
                        <TableContainer component={Paper} elevation={0}
                            sx={{ border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'var(--color-accent-light)' }}>
                                        {['Collection Name', 'Documents', 'Data Size', 'Storage', 'Indexes', ''].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
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
                                                    <TableRowsIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} />
                                                    <span className="font-semibold text-gray-800 text-sm">{col.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={col.count.toLocaleString()} size="small"
                                                    sx={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', fontWeight: 700, fontSize: 11, border: '1px solid var(--color-border)' }} />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmt(col.size)}</TableCell>
                                            <TableCell sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmt(col.storageSize)}</TableCell>
                                            <TableCell sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{col.indexes}</TableCell>
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
                    </div>
                </>
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
        <div className="flex flex-col gap-4">
            {/* Edit modal */}
            <EditDocModal open={!!editDoc} doc={editDoc} collection={collectionName}
                onClose={() => setEditDoc(null)} onSaved={handleSaved} />
            {/* Delete modal */}
            <DeleteDocModal open={!!deleteDoc} doc={deleteDoc} collection={collectionName}
                onClose={() => setDeleteDoc(null)} onDeleted={handleDeleted} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} aria-label="Back to collections"
                    className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 shrink-0">
                    <ArrowLeft size={18} />
                </button>
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <Table2 size={22} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight truncate">{collectionName}</h1>
                    <p className="text-xs text-gray-500">{total.toLocaleString()} document{total === 1 ? '' : 's'}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by _id or keyword…"
                        className="w-full border border-gray-200 rounded-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#E84B0F] focus:ring-2 focus:ring-[#E84B0F]/20 transition"
                    />
                </div>
                <button onClick={handleSearch}
                    className="text-sm font-semibold text-white rounded-full px-4 py-2.5 shrink-0"
                    style={{ backgroundColor: 'var(--color-accent)' }}>
                    Search
                </button>
                <button onClick={() => { setSearchInput(''); setSearch(''); load(1, ''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 shrink-0">
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
                    {/* Mobile cards */}
                    <div className="sm:hidden flex flex-col gap-3">
                        {docs.map((doc) => (
                            <article key={doc._id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3">
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">_id</p>
                                        <p className="text-xs font-mono text-gray-700 break-all">{doc._id}</p>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <button onClick={() => setEditDoc(doc)} aria-label="Edit document"
                                            className="w-8 h-8 rounded-lg bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setDeleteDoc(doc)} aria-label="Delete document"
                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2.5 flex flex-col gap-1 border-t border-gray-100 pt-2">
                                    {fields.filter(f => f !== '_id').slice(0, 4).map(f => (
                                        <div key={f} className="flex gap-2 text-xs">
                                            <span className="font-mono text-gray-400 shrink-0 max-w-[42%] truncate">{f}</span>
                                            <span className="text-gray-700 min-w-0 flex-1 truncate">{cellText(doc, f)}</span>
                                        </div>
                                    ))}
                                    {fields.filter(f => f !== '_id').length > 4 && (
                                        <p className="text-[11px] text-gray-400">+{fields.filter(f => f !== '_id').length - 4} more fields</p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block mb-3">
                    <TableContainer component={Paper} elevation={0}
                        sx={{ border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'var(--color-accent-light)' }}>
                                    {displayFields.map(f => (
                                        <TableCell key={f}
                                            sx={{ fontWeight: 700, fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', fontFamily: 'monospace' }}>
                                            {f}
                                        </TableCell>
                                    ))}
                                    {fields.length > 6 && (
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                                            +{fields.length - 6} more
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {docs.map((doc) => (
                                    <TableRow key={doc._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        {displayFields.map(f => (
                                            <TableCell key={f} sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>
                                                {cellVal(doc, f)}
                                            </TableCell>
                                        ))}
                                        {fields.length > 6 && <TableCell sx={{ borderBottom: '1px solid var(--color-border)' }} />}
                                        <TableCell sx={{ textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>
                                            <Tooltip title="Edit document">
                                                <IconButton size="small" onClick={() => setEditDoc(doc)}
                                                    sx={{ color: 'var(--color-accent)', '&:hover': { backgroundColor: 'var(--color-accent-light)' } }}>
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
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex justify-center">
                            <Pagination count={pages} page={page} onChange={handlePageChange}
                                sx={{
                                    '& .MuiPaginationItem-root': { borderRadius: '0.6rem' },
                                    '& .Mui-selected': { backgroundColor: 'var(--color-accent) !important', color: '#fff' },
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
        <div className="flex flex-col gap-4 sm:gap-6">
            <MetaData title="Database" />
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
    );
};

export default DatabaseManager;
