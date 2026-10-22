import { useState } from 'react';
import PaletteIcon from '@mui/icons-material/Palette';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckIcon from '@mui/icons-material/Check';
import { tintColor, darkenColor } from '../../utils/themeColors';

// ── Preset colour palettes ────────────────────────────────────────────────────
// A preset is a *complete* look: colour + shape + typography. Every token the
// ThemeEditor exposes is included so switching presets never leaves a stale
// accent tint, radius, font or status colour behind.
const PRESETS = [
    {
        name: 'Ocean Blue',
        theme: {
            colorAccent: '#3b82f6', colorAccentHover: '#2563eb', colorAccentLight: 'rgba(59,130,246,0.10)',
            colorSuccess: '#16a34a', colorWarning: '#f59e0b', colorDanger: '#ef4444',
            colorHeader: '#ffffff', colorHeaderText: '#0f172a',
            colorFooter: '#0f172a', colorFooterText: '#94a3b8',
            colorAnnouncement: '#3b82f6', colorAnnouncementText: '#ffffff',
            colorBg: '#fafbfc', colorSurface: '#ffffff', colorBorder: '#e8ecf1',
            colorTextPrimary: '#0f172a', colorTextSecondary: '#475569', colorTextMuted: '#94a3b8',
            btnRadius: '0.75rem', cardRadius: '0.75rem',
            fontBody: 'Inter', fontDisplay: 'Sora', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: false,
        },
        accent: '#3b82f6',
    },
    {
        name: 'Purple Pro',
        theme: {
            colorAccent: '#7c3aed', colorAccentHover: '#6d28d9', colorAccentLight: 'rgba(124,58,237,0.10)',
            colorSuccess: '#16a34a', colorWarning: '#f59e0b', colorDanger: '#ef4444',
            colorHeader: '#ffffff', colorHeaderText: '#1e1b4b',
            colorFooter: '#1e1b4b', colorFooterText: '#a5b4fc',
            colorAnnouncement: '#7c3aed', colorAnnouncementText: '#ffffff',
            colorBg: '#faf9ff', colorSurface: '#ffffff', colorBorder: '#ede9fe',
            colorTextPrimary: '#1e1b4b', colorTextSecondary: '#5b5578', colorTextMuted: '#9c96b8',
            btnRadius: '0.75rem', cardRadius: '1rem',
            fontBody: 'Poppins', fontDisplay: 'Montserrat', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: false,
        },
        accent: '#7c3aed',
    },
    {
        name: 'Emerald Fresh',
        theme: {
            colorAccent: '#059669', colorAccentHover: '#047857', colorAccentLight: 'rgba(5,150,105,0.10)',
            colorSuccess: '#16a34a', colorWarning: '#f59e0b', colorDanger: '#ef4444',
            colorHeader: '#ffffff', colorHeaderText: '#064e3b',
            colorFooter: '#064e3b', colorFooterText: '#6ee7b7',
            colorAnnouncement: '#059669', colorAnnouncementText: '#ffffff',
            colorBg: '#f0fdf4', colorSurface: '#ffffff', colorBorder: '#d1fae5',
            colorTextPrimary: '#064e3b', colorTextSecondary: '#3f6b58', colorTextMuted: '#86b8a0',
            btnRadius: '0.75rem', cardRadius: '0.75rem',
            fontBody: 'Nunito', fontDisplay: 'Raleway', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: false,
        },
        accent: '#059669',
    },
    {
        name: 'Rose Bold',
        theme: {
            colorAccent: '#e11d48', colorAccentHover: '#be123c', colorAccentLight: 'rgba(225,29,72,0.10)',
            colorSuccess: '#16a34a', colorWarning: '#f59e0b', colorDanger: '#ef4444',
            colorHeader: '#ffffff', colorHeaderText: '#881337',
            colorFooter: '#881337', colorFooterText: '#fda4af',
            colorAnnouncement: '#e11d48', colorAnnouncementText: '#ffffff',
            colorBg: '#fff1f2', colorSurface: '#ffffff', colorBorder: '#fecdd3',
            colorTextPrimary: '#4c0519', colorTextSecondary: '#7c3a4a', colorTextMuted: '#b98a94',
            btnRadius: '9999px', cardRadius: '1rem',
            fontBody: 'Manrope', fontDisplay: 'Playfair Display', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: false,
        },
        accent: '#e11d48',
    },
    {
        name: 'Amber Warm',
        theme: {
            colorAccent: '#d97706', colorAccentHover: '#b45309', colorAccentLight: 'rgba(217,119,6,0.10)',
            colorSuccess: '#16a34a', colorWarning: '#f59e0b', colorDanger: '#ef4444',
            colorHeader: '#fffbeb', colorHeaderText: '#451a03',
            colorFooter: '#78350f', colorFooterText: '#fcd34d',
            colorAnnouncement: '#d97706', colorAnnouncementText: '#ffffff',
            colorBg: '#fffbeb', colorSurface: '#ffffff', colorBorder: '#fde68a',
            colorTextPrimary: '#451a03', colorTextSecondary: '#78500f', colorTextMuted: '#b08d52',
            btnRadius: '0.75rem', cardRadius: '1rem',
            fontBody: 'Poppins', fontDisplay: 'Sora', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: false,
        },
        accent: '#d97706',
    },
    {
        name: 'Dark Night',
        theme: {
            colorAccent: '#6366f1', colorAccentHover: '#4f46e5', colorAccentLight: 'rgba(99,102,241,0.16)',
            colorSuccess: '#22c55e', colorWarning: '#fbbf24', colorDanger: '#f87171',
            colorHeader: '#1e293b', colorHeaderText: '#f1f5f9',
            colorFooter: '#020617', colorFooterText: '#64748b',
            colorAnnouncement: '#1e293b', colorAnnouncementText: '#a5b4fc',
            colorBg: '#0f172a', colorSurface: '#1e293b', colorBorder: '#334155',
            colorTextPrimary: '#f1f5f9', colorTextSecondary: '#94a3b8', colorTextMuted: '#64748b',
            btnRadius: '0.75rem', cardRadius: '1rem',
            fontBody: 'Inter', fontDisplay: 'Sora', fontScale: '1', containerWidth: '1280px', btnStyle: 'filled',
            darkMode: true,
        },
        accent: '#6366f1',
        dark: true,
    },
];

const FONT_BODY_OPTIONS = ['Manrope', 'Roboto', 'Inter', 'Poppins', 'Nunito', 'Lato'];
const FONT_DISPLAY_OPTIONS = ['Sora', 'Montserrat', 'Raleway', 'Playfair Display', 'Merriweather'];
const FONT_SCALE_OPTIONS = [
    { label: 'Small (90%)',  value: '0.9' },
    { label: 'Normal (100%)', value: '1' },
    { label: 'Large (110%)',  value: '1.1' },
    { label: 'XL (120%)',     value: '1.2' },
];
const BTN_RADIUS_OPTIONS = [
    { label: 'Square',   value: '0rem' },
    { label: 'Rounded',  value: '0.375rem' },
    { label: 'Pill',     value: '0.5rem' },
    { label: 'Full Pill',value: '9999px' },
];
const CARD_RADIUS_OPTIONS = [
    { label: 'Square',  value: '0rem' },
    { label: 'Slight',  value: '0.375rem' },
    { label: 'Rounded', value: '0.75rem' },
    { label: 'Large',   value: '1rem' },
    { label: 'XL',      value: '1.5rem' },
];
const CONTAINER_OPTIONS = [
    { label: '1024px',  value: '1024px' },
    { label: '1280px',  value: '1280px' },
    { label: '1440px',  value: '1440px' },
    { label: 'Full',    value: '100%' },
];
const BTN_STYLE_OPTIONS = [
    { label: 'Filled',  value: 'filled' },
    { label: 'Outline', value: 'outline' },
    { label: 'Soft',    value: 'soft' },
];

// ── Colour picker row ─────────────────────────────────────────────────────────
const ColorRow = ({ label, value, onChange, description, readOnly = false }) => {
    // The native picker only accepts hex. Tokens like the accent tint are
    // stored as rgba(), so fall back to the accent's hex for the swatch while
    // still showing the real value in the text box.
    const hexForPicker = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value || '') ? value : '#E84B0F';
    const swatch = value || 'transparent';
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <div
                className="w-9 h-9 rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden shadow-sm relative"
                title={label}
                style={{ backgroundColor: swatch, cursor: readOnly ? 'default' : 'pointer' }}
            >
                {!readOnly && (
                    <input
                        type="color"
                        value={hexForPicker}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label={label}
                    />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
            {readOnly ? (
                <span className="w-28 text-xs font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 truncate" title={value}>
                    {value || '—'}
                </span>
            ) : (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-28 text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-gray-50"
                    placeholder="#000000"
                />
            )}
        </div>
    );
};

// ── Select row ────────────────────────────────────────────────────────────────
const SelectRow = ({ label, value, options, onChange }) => (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
        <p className="flex-1 text-sm font-medium text-gray-900">{label}</p>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
        >
            {options.map((opt) => (
                typeof opt === 'string'
                    ? <option key={opt} value={opt}>{opt}</option>
                    : <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-gray-500">{icon}</span>
            <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

// ── CSS variable map shared by the live preview ───────────────────────────────
// (one source of truth so every editable token also previews instantly)
const CSS_VAR_MAP = {
    colorAccent:           '--color-accent',
    colorAccentHover:      '--color-accent-hover',
    colorAccentLight:      '--color-accent-light',
    colorSuccess:          '--color-success',
    colorWarning:          '--color-warning',
    colorDanger:           '--color-danger',
    colorBg:               '--color-bg',
    colorSurface:          '--color-surface',
    colorBorder:           '--color-border',
    colorTextPrimary:      '--color-text-primary',
    colorTextSecondary:    '--color-text-secondary',
    colorTextMuted:        '--color-text-muted',
    colorHeader:           '--color-header',
    colorHeaderText:       '--color-header-text',
    colorFooter:           '--color-footer',
    colorFooterText:       '--color-footer-text',
    colorAnnouncement:     '--color-announcement',
    colorAnnouncementText: '--color-announcement-text',
    btnRadius:             '--btn-radius',
    cardRadius:            '--card-radius',
    fontBody:              '--font-body',
    fontDisplay:           '--font-display',
    fontScale:             '--font-scale',
    containerWidth:        '--container-width',
};

// ── Main ThemeEditor ──────────────────────────────────────────────────────────
const ThemeEditor = ({ theme, onChange }) => {
    const [activePreset, setActivePreset] = useState(null);

    const set = (key, value) => onChange({ ...theme, [key]: value });

    // Apply a whole theme object to :root for instant live preview.
    const previewTheme = (t) => {
        const root = document.documentElement;
        Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
            if (t[key] !== undefined && t[key] !== null && t[key] !== '') {
                root.style.setProperty(cssVar, String(t[key]));
            }
        });
        // Button style is a data attribute (drives .btn-accent variants), not
        // a CSS variable, so it is previewed separately.
        root.setAttribute('data-btn-style', t.btnStyle || 'filled');
    };

    const applyPreset = (preset) => {
        setActivePreset(preset.name);
        const next = { ...theme, ...preset.theme };
        // Keep the accent-derived tint/hover in sync even if a preset omitted them
        if (!next.colorAccentHover) next.colorAccentHover = darkenColor(next.colorAccent);
        if (!next.colorAccentLight) next.colorAccentLight = tintColor(next.colorAccent);
        previewTheme(next);
        // Dark mode is a class toggle, not a CSS var
        document.documentElement.classList.toggle('dark-mode', !!next.darkMode);
        onChange(next);
    };

    // Live preview: apply to CSS vars in real time as admin changes them
    const handleColorChange = (key, value) => {
        if (CSS_VAR_MAP[key]) {
            document.documentElement.style.setProperty(CSS_VAR_MAP[key], value);
        }
        // Changing the accent re-derives the tint + hover so the pale accent
        // surfaces never keep the *previous* colour.
        if (key === 'colorAccent') {
            const hover = darkenColor(value);
            const light = tintColor(value);
            document.documentElement.style.setProperty('--color-accent-hover', hover);
            document.documentElement.style.setProperty('--color-accent-light', light);
            onChange({ ...theme, colorAccent: value, colorAccentHover: hover, colorAccentLight: light });
            return;
        }
        set(key, value);
    };

    const handleDarkMode = (dark) => {
        if (dark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        set('darkMode', dark);
    };

    // Generic setter for non-colour tokens (shape / typography) with preview.
    const setToken = (key, value) => {
        if (key === 'btnStyle') {
            document.documentElement.setAttribute('data-btn-style', value || 'filled');
        } else if (CSS_VAR_MAP[key]) {
            document.documentElement.style.setProperty(CSS_VAR_MAP[key], value);
        }
        set(key, value);
    };

    return (
        <div className="flex flex-col gap-5">

            {/* ── Presets ── */}
            <Section icon={<PaletteIcon sx={{ fontSize: 18 }} />} title="Quick Presets">
                <p className="text-xs text-gray-500 mb-3">One-click colour palettes — fine-tune below after applying.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition text-left ${
                                activePreset === preset.name
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div
                                className="w-7 h-7 rounded-lg flex-shrink-0 shadow-sm border border-white/40"
                                style={{ backgroundColor: preset.accent }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{preset.name}</p>
                                {preset.dark && <p className="text-[10px] text-gray-400">Dark</p>}
                            </div>
                            {activePreset === preset.name && (
                                <CheckIcon sx={{ fontSize: 14 }} className="text-blue-500 absolute top-1.5 right-1.5" />
                            )}
                        </button>
                    ))}
                </div>
            </Section>

            {/* ── Dark / Light mode ── */}
            <Section icon={theme.darkMode ? <DarkModeIcon sx={{ fontSize: 18 }} /> : <LightModeIcon sx={{ fontSize: 18 }} />} title="Dark / Light Mode">
                <div className="flex gap-3">
                    <button
                        onClick={() => handleDarkMode(false)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition ${
                            !theme.darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <LightModeIcon sx={{ fontSize: 28, color: theme.darkMode ? '#94a3b8' : '#f59e0b' }} />
                        <span className="text-sm font-semibold text-gray-700">Light Mode</span>
                    </button>
                    <button
                        onClick={() => handleDarkMode(true)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition ${
                            theme.darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <DarkModeIcon sx={{ fontSize: 28, color: theme.darkMode ? '#6366f1' : '#94a3b8' }} />
                        <span className="text-sm font-semibold text-gray-700">Dark Mode</span>
                    </button>
                </div>
            </Section>

            {/* ── Brand & Accent Colours ── */}
            <Section icon={<PaletteIcon sx={{ fontSize: 18 }} />} title="Brand & Accent Colours">
                <ColorRow label="Primary Accent"     value={theme.colorAccent}       onChange={(v) => handleColorChange('colorAccent', v)}       description="Buttons, links, highlights" />
                <ColorRow label="Accent Hover"       value={theme.colorAccentHover}  readOnly                    description="Auto-derived from the accent (darker shade)" />
                <ColorRow label="Accent Tint"        value={theme.colorAccentLight}  readOnly                    description="Auto-derived pale wash behind icons & badges" />
                <ColorRow label="Success / In Stock" value={theme.colorSuccess}      onChange={(v) => handleColorChange('colorSuccess', v)}      description="Green badges, stock" />
                <ColorRow label="Warning / COD"      value={theme.colorWarning}      onChange={(v) => handleColorChange('colorWarning', v)}      description="Amber badges" />
                <ColorRow label="Danger / Error"     value={theme.colorDanger}       onChange={(v) => handleColorChange('colorDanger', v)}       description="Error states, out-of-stock" />
            </Section>

            {/* ── Background & Surfaces ── */}
            <Section icon={<DashboardIcon sx={{ fontSize: 18 }} />} title="Background & Surfaces">
                <ColorRow label="Page Background"  value={theme.colorBg}      onChange={(v) => handleColorChange('colorBg', v)}      description="Body background" />
                <ColorRow label="Card / Surface"   value={theme.colorSurface} onChange={(v) => handleColorChange('colorSurface', v)} description="Cards, modals, dropdowns" />
                <ColorRow label="Borders / Dividers" value={theme.colorBorder} onChange={(v) => handleColorChange('colorBorder', v)} description="Card borders, separators" />
            </Section>

            {/* ── Text Colours ── */}
            <Section icon={<FormatSizeIcon sx={{ fontSize: 18 }} />} title="Text Colours">
                <ColorRow label="Primary Text"   value={theme.colorTextPrimary}   onChange={(v) => handleColorChange('colorTextPrimary', v)}   description="Headings, main body" />
                <ColorRow label="Secondary Text" value={theme.colorTextSecondary} onChange={(v) => handleColorChange('colorTextSecondary', v)} description="Labels, subtitles" />
                <ColorRow label="Muted Text"     value={theme.colorTextMuted}     onChange={(v) => handleColorChange('colorTextMuted', v)}     description="Hints, placeholders" />
            </Section>

            {/* ── Header & Footer ── */}
            <Section icon={<DashboardIcon sx={{ fontSize: 18 }} />} title="Header & Footer">
                <ColorRow label="Header Background" value={theme.colorHeader}           onChange={(v) => handleColorChange('colorHeader', v)}           description="Top navigation bar" />
                <ColorRow label="Header Text"       value={theme.colorHeaderText}       onChange={(v) => handleColorChange('colorHeaderText', v)}       description="Nav links, logo text" />
                <ColorRow label="Footer Background" value={theme.colorFooter}           onChange={(v) => handleColorChange('colorFooter', v)}           description="Bottom footer" />
                <ColorRow label="Footer Text"       value={theme.colorFooterText}       onChange={(v) => handleColorChange('colorFooterText', v)}       description="Footer links, copy" />
                <ColorRow label="Announcement Bar"  value={theme.colorAnnouncement}     onChange={(v) => handleColorChange('colorAnnouncement', v)}     description="Top announcement strip" />
                <ColorRow label="Announcement Text" value={theme.colorAnnouncementText} onChange={(v) => handleColorChange('colorAnnouncementText', v)} description="Text on announcement bar" />
            </Section>

            {/* ── Typography ── */}
            <Section icon={<FormatSizeIcon sx={{ fontSize: 18 }} />} title="Typography">
                <SelectRow label="Body Font"    value={theme.fontBody}    options={FONT_BODY_OPTIONS}    onChange={(v) => setToken('fontBody', v)} />
                <SelectRow label="Display Font" value={theme.fontDisplay} options={FONT_DISPLAY_OPTIONS} onChange={(v) => setToken('fontDisplay', v)} />
                <SelectRow label="Font Scale"   value={theme.fontScale}   options={FONT_SCALE_OPTIONS}   onChange={(v) => setToken('fontScale', v)} />
            </Section>

            {/* ── Layout & Shape ── */}
            <Section icon={<DashboardIcon sx={{ fontSize: 18 }} />} title="Layout & Shape">
                <SelectRow label="Button Radius"   value={theme.btnRadius}       options={BTN_RADIUS_OPTIONS}   onChange={(v) => setToken('btnRadius', v)} />
                <SelectRow label="Card Radius"     value={theme.cardRadius}      options={CARD_RADIUS_OPTIONS}  onChange={(v) => setToken('cardRadius', v)} />
                <SelectRow label="Container Width" value={theme.containerWidth}  options={CONTAINER_OPTIONS}    onChange={(v) => setToken('containerWidth', v)} />
                <SelectRow label="Button Style"    value={theme.btnStyle || 'filled'} options={BTN_STYLE_OPTIONS} onChange={(v) => setToken('btnStyle', v)} />
            </Section>

        </div>
    );
};

export default ThemeEditor;
