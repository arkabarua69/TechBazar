/**
 * ImgBBSettings — Admin panel section
 *
 * Lets the admin:
 *  - View current ImgBB enabled/disabled state (key masked, never shown)
 *  - Enter / update the API key
 *  - Toggle ImgBB on or off
 *  - Test the current stored key with a live round-trip to ImgBB
 *
 * Mounted inside WebsiteConfig.jsx as the "ImgBB" category panel.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
    Image,
    Eye,
    EyeOff,
    Save,
    CheckCircle,
    XCircle,
    Loader2,
    FlaskConical,
    ExternalLink,
} from 'lucide-react';

const MASK = '••••••••••••••••••••';

const inputCls =
    'border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 w-full bg-white';
const labelCls = 'text-xs font-medium text-gray-500 mb-1 block';

const StatusBadge = ({ enabled }) => (
    <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            enabled
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
        }`}
    >
        {enabled ? (
            <><CheckCircle size={11} /> Active</>
        ) : (
            <><XCircle size={11} /> Disabled</>
        )}
    </span>
);

const ImgBBSettings = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [enabled, setEnabled]       = useState(true);
    const [apiKey, setApiKey]         = useState('');         // new key typed by admin
    const [hasExisting, setHasExisting] = useState(false);    // whether DB already has a key
    const [showKey, setShowKey]       = useState(false);
    const [editing, setEditing]       = useState(false);      // focused on key input

    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [testing, setTesting]       = useState(false);
    const [testResult, setTestResult] = useState(null);       // { success, message, sampleUrl? }

    // Test a key. `key` omitted → the backend tests the stored/env key.
    const runTest = async (key) => {
        setTesting(true);
        setTestResult(null);
        try {
            const { data } = await axios.post('/api/v1/admin/imgbb/test', key ? { apiKey: key } : {});
            setTestResult({ success: true, message: data.message || 'API key is valid', sampleUrl: data.sampleUrl });
            return { ok: true, message: data.message || 'API key is valid' };
        } catch (err) {
            const msg = err.response?.data?.message || 'Test failed';
            setTestResult({ success: false, message: msg });
            return { ok: false, message: msg };
        } finally {
            setTesting(false);
        }
    };

    // ── Load current config ──────────────────────────────────────────────
    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get('/api/v1/admin/websiteconfig');
                const imgbb = data?.config?.imgbb || {};
                setEnabled(imgbb.enabled !== false);
                // If there's a masked value, a key exists in the DB
                setHasExisting(!!(imgbb.apiKey && imgbb.apiKey !== ''));
            } catch (err) {
                enqueueSnackbar('Failed to load ImgBB settings', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [enqueueSnackbar]);

    // Auto-verify the stored key once the panel opens, so an invalid key is
    // surfaced immediately with a clear call-to-action.
    useEffect(() => {
        if (!loading) runTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    // ── Save settings ────────────────────────────────────────────────────
    const handleSave = async () => {
        const newKey = apiKey.trim();
        const payload = { imgbb: { enabled } };
        // Only send apiKey if admin actually typed a new one
        if (newKey) {
            payload.imgbb.apiKey = newKey;
        }

        setSaving(true);
        try {
            await axios.put('/api/v1/admin/websiteconfig', { config: payload });
            enqueueSnackbar('ImgBB settings saved', { variant: 'success' });
            if (newKey) {
                setHasExisting(true);
                setApiKey('');
                setEditing(false);
                // Verify the newly saved key immediately so any problem shows now.
                const res = await runTest();
                if (!res.ok) {
                    enqueueSnackbar(`Saved, but the key check failed: ${res.message}`, { variant: 'warning' });
                }
            }
        } catch (err) {
            enqueueSnackbar(
                err.response?.data?.message || 'Save failed',
                { variant: 'error' }
            );
        } finally {
            setSaving(false);
        }
    };

    // ── Test stored key ──────────────────────────────────────────────────
    const handleTest = async () => {
        // If admin typed a new key, test that one; otherwise test the stored key
        const res = await runTest(apiKey.trim() || undefined);
        enqueueSnackbar(res.message, { variant: res.ok ? 'success' : 'error' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={22} className="animate-spin mr-2" /> Loading ImgBB settings…
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">

            {/* ── Header card ─────────────────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                    <span className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                        <Image size={20} className="text-orange-500" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm font-semibold text-gray-900">ImgBB Image Hosting</h2>
                            <StatusBadge enabled={enabled} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            All product images, brand logos, banners, and avatars are uploaded to
                            ImgBB and served from <strong>i.ibb.co</strong>.
                            The API key is encrypted at rest and never exposed to the browser.
                        </p>
                        <a
                            href="https://api.imgbb.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                        >
                            Get a free API key at imgbb.com <ExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </div>

            {/* ── Settings card ────────────────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col gap-5">

                {/* Enable / Disable toggle */}
                <div className="flex items-center justify-between gap-4 py-1">
                    <div>
                        <p className="text-sm font-medium text-gray-800">Enable ImgBB</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            When disabled, image uploads will fail until re-enabled.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEnabled((v) => !v)}
                        style={{
                            width: 40, height: 22, borderRadius: 11,
                            backgroundColor: enabled ? '#E84B0F' : '#d1d5db',
                            position: 'relative', transition: 'background-color 0.2s',
                            flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0,
                        }}
                        aria-checked={enabled}
                        role="switch"
                        aria-label="Toggle ImgBB"
                    >
                        <span style={{
                            position: 'absolute', top: 3,
                            left: enabled ? 21 : 3, width: 16, height: 16,
                            borderRadius: '50%', backgroundColor: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s',
                        }} />
                    </button>
                </div>

                <hr className="border-gray-100" />

                {/* API Key input */}
                <div>
                    <label className={labelCls}>API Key</label>
                    <div className="relative">
                        <input
                            type={showKey && editing ? 'text' : 'password'}
                            value={editing ? apiKey : (hasExisting ? MASK : '')}
                            onFocus={() => setEditing(true)}
                            onChange={(e) => setApiKey(e.target.value)}
                            onBlur={() => { if (!apiKey.trim()) { setEditing(false); } }}
                            placeholder={hasExisting ? 'Enter new key to replace existing' : 'Paste your ImgBB API key'}
                            className={inputCls + ' pr-10 font-mono'}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                            aria-label={showKey ? 'Hide key' : 'Show key'}
                        >
                            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {hasExisting
                            ? 'A key is already stored. Leave blank to keep it unchanged.'
                            : 'Required for image uploads. Never shared with the browser.'}
                    </p>
                </div>

                {/* Test result banner */}
                {testResult && (
                    <div
                        className={`rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm ${
                            testResult.success
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                    >
                        {testResult.success
                            ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
                            : <XCircle size={16} className="shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                            <p className="font-medium">{testResult.message}</p>
                            {testResult.sampleUrl && (
                                <a
                                    href={testResult.sampleUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs underline opacity-70 hover:opacity-100 truncate block mt-0.5"
                                >
                                    Sample upload: {testResult.sampleUrl}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-[#E84B0F] hover:bg-[#C63E0A] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        {saving
                            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                            : <><Save size={14} /> Save Settings</>}
                    </button>

                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={testing}
                        className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        {testing
                            ? <><Loader2 size={14} className="animate-spin" /> Testing…</>
                            : <><FlaskConical size={14} /> Test Key</>}
                    </button>
                </div>
            </div>

            {/* ── How it works ─────────────────────────────────────────────────── */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                    How it works
                </h3>
                <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside opacity-90">
                    <li>All image uploads (products, logos, avatars, banners) go through the backend.</li>
                    <li>The API key is AES-256 encrypted in MongoDB and <strong>never sent to the browser</strong>.</li>
                    <li>Images are served from ImgBB's CDN at <code className="bg-blue-100 px-1 rounded">i.ibb.co</code>.</li>
                    <li>Each image's <code className="bg-blue-100 px-1 rounded">delete_url</code> is stored in the database for future cleanup.</li>
                    <li>Get a free API key at <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" className="underline">api.imgbb.com</a> (free tier: 32 MB / image, unlimited uploads).</li>
                </ul>
            </div>
        </div>
    );
};

export default ImgBBSettings;
