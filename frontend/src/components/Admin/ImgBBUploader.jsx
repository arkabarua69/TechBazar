/**
 * ImgBBUploader — reusable image upload widget
 *
 * Flow:
 *   1. Admin picks a file  →  instant local preview shown
 *   2. Admin clicks "Upload to ImgBB"
 *      → POSTs base64 to /api/v1/admin/imgbb/upload (key stays server-side)
 *      → receives hosted URL
 *   3. Immediately calls onUploaded(url)  — updates parent state
 *   4. If onAutoSave is provided, immediately calls onAutoSave(url)
 *      — persists the URL to the DB RIGHT AWAY so it survives a page reload
 *      without the admin needing to hit a separate "Save" button.
 *
 * Props:
 *   label        {string}    — field label
 *   currentUrl   {string}    — existing DB URL shown when idle
 *   onUploaded   {function}  — called with new URL (updates local state in parent)
 *   onAutoSave   {function}  — optional async (url) => ... that saves to DB immediately
 *   accept       {string}    — file type filter (default "image/*")
 *   maxSizeMB    {number}    — client-side guard (default 32)
 *   className    {string}    — extra Tailwind classes on root
 *   previewClass {string}    — Tailwind classes on preview img
 */

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const ImgBBUploader = ({
    label        = 'Image',
    currentUrl   = '',
    onUploaded,
    onAutoSave,               // ← key new prop: auto-persist after upload
    accept       = 'image/*',
    maxSizeMB    = 32,
    className    = '',
    previewClass = 'max-h-40 max-w-full object-contain',
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef(null);

    const [preview,     setPreview]     = useState('');   // local data-URI (before upload)
    const [urlInput,    setUrlInput]    = useState('');   // paste-URL tab
    const [tab,         setTab]         = useState('file');
    const [uploading,   setUploading]   = useState(false);
    const [autoSaving,  setAutoSaving]  = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');   // confirmed hosted URL this session

    // When parent resets currentUrl (e.g. config reloads), clear session state
    useEffect(() => {
        setUploadedUrl('');
        setPreview('');
    }, [currentUrl]);

    const displayUrl = uploadedUrl || currentUrl;

    // ── File picker ──────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > maxSizeMB * 1024 * 1024) {
            enqueueSnackbar(`File too large — max ${maxSizeMB} MB`, { variant: 'warning' });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setPreview(reader.result);
                setUploadedUrl('');
            }
        };
        reader.readAsDataURL(file);
    };

    // ── Core: upload + optional immediate DB save ─────────────────────
    const handleUpload = async () => {
        const imageData = tab === 'file' ? preview : urlInput.trim();

        if (!imageData) {
            enqueueSnackbar('Pick a file or enter an image URL first', { variant: 'warning' });
            return;
        }

        // Paste-URL shortcut: if it's already an https:// URL, no re-hosting needed
        if (tab === 'url' && imageData.startsWith('http')) {
            setUploadedUrl(imageData);
            setPreview('');
            if (onUploaded) onUploaded(imageData);
            // Auto-save to DB
            if (onAutoSave) {
                setAutoSaving(true);
                try {
                    await onAutoSave(imageData);
                    enqueueSnackbar(`${label} URL saved`, { variant: 'success' });
                } catch {
                    enqueueSnackbar('URL updated locally but DB save failed — click Save manually', { variant: 'warning' });
                } finally {
                    setAutoSaving(false);
                }
            } else {
                enqueueSnackbar('URL saved', { variant: 'success' });
            }
            return;
        }

        // Upload to ImgBB via backend proxy
        setUploading(true);
        try {
            const { data } = await axios.post(
                '/api/v1/admin/imgbb/upload',
                { image: imageData, name: label.replace(/\s+/g, '-').toLowerCase() },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const hostedUrl = data.display_url || data.url;
            setUploadedUrl(hostedUrl);
            setPreview('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onUploaded) onUploaded(hostedUrl);
            enqueueSnackbar('Uploaded to ImgBB ✓', { variant: 'success' });

            // ── Immediately persist URL to DB ─────────────────────────
            if (onAutoSave) {
                setAutoSaving(true);
                try {
                    await onAutoSave(hostedUrl);
                    enqueueSnackbar(`${label} saved to database ✓`, { variant: 'success' });
                } catch {
                    enqueueSnackbar('Uploaded but DB save failed — click Save manually', { variant: 'warning' });
                } finally {
                    setAutoSaving(false);
                }
            }
        } catch (err) {
            enqueueSnackbar(
                err.response?.data?.message || 'ImgBB upload failed',
                { variant: 'error' }
            );
        } finally {
            setUploading(false);
        }
    };

    const handleClear = () => {
        setPreview('');
        setUploadedUrl('');
        setUrlInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onUploaded) onUploaded('');
    };

    const busy = uploading || autoSaving;

    const tabBtn = (active) =>
        `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            active
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>

            {label && (
                <label className="text-xs font-medium text-gray-500 block">{label}</label>
            )}

            {/* Tab switcher */}
            <div className="flex gap-1.5">
                <button type="button" className={tabBtn(tab === 'file')} onClick={() => setTab('file')}>
                    Upload File
                </button>
                <button type="button" className={tabBtn(tab === 'url')} onClick={() => setTab('url')}>
                    Paste URL
                </button>
            </div>

            {/* File input */}
            {tab === 'file' && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
            )}

            {/* URL input */}
            {tab === 'url' && (
                <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 w-full bg-white"
                />
            )}

            {/* Local preview (before upload) */}
            {preview && (
                <div className="border border-dashed border-orange-200 rounded-xl p-2 bg-orange-50 flex flex-col items-center gap-2">
                    <img src={preview} alt="Preview" className={previewClass} />
                    <p className="text-xs text-orange-500 font-medium">
                        Local preview — click Upload to host on ImgBB
                    </p>
                </div>
            )}

            {/* Hosted / existing URL preview */}
            {!preview && displayUrl && (
                <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 flex flex-col items-center gap-1">
                    <img
                        src={displayUrl}
                        alt="Hosted"
                        className={previewClass}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <a
                        href={displayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate max-w-full"
                    >
                        {displayUrl}
                    </a>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap items-center">

                {/* Upload button */}
                {(preview || (tab === 'url' && urlInput)) && (
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={busy}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Uploading…
                            </>
                        ) : autoSaving ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Saving…
                            </>
                        ) : (
                            <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"/>
                                </svg>
                                Upload to ImgBB
                            </>
                        )}
                    </button>
                )}

                {/* Saved indicator */}
                {uploadedUrl && !busy && (
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Saved
                    </span>
                )}

                {/* Clear button */}
                {(displayUrl || preview) && !busy && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImgBBUploader;
