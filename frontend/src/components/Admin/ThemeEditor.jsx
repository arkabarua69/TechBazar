import { useState } from 'react';
import PaletteIcon from '@mui/icons-material/Palette';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckIcon from '@mui/icons-material/Check';

// ── Preset colour palettes ────────────────────────────────────────────────────
const PRESETS = [
    {
        name: 'TechBazar Blue',
        theme: {
            colorAccent: '#3b82f6', colorAccentHover: '#2563eb',
            colorHeader: '#ffffff', colorHeaderText: '#0f172a',
            colorFooter: '#0f172a', colorFooterText: '#94a3b8',
            colorAnnouncement: '#0f172a', colorAnnouncementText: '#ffffff',
            colorBg: '#fafbfc', colorSurface: '#ffffff', colorBorder: '#e8ecf1',
            darkMode: false,
        },
        accent: '#3b82f6',
    },
    {
        name: 'Purple Pro',
        theme: {
            colorAccent: '#7c3aed', colorAccentHover: '#6d28d9',
            colorHeader: '#ffffff', colorHeaderText: '#0f172a',
            colorFooter: '#1e1b4b', colorFooterText: '#a5b4fc',
            colorAnnouncement: '#7c3aed', colorAnnouncementText: '#ffffff',
            colorBg: '#faf9ff', colorSurface: '#ffffff', colorBorder: '#ede9fe',
            darkMode: false,
        },
        accent: '#7c3aed',
    },
    {
        name: 'Emerald Fresh',
        theme: {
            colorAccent: '#059669', colorAccentHover: '#047857',
            colorHeader: '#ffffff', colorHeaderText: '#0f172a',
            colorFooter: '#064e3b', colorFooterText: '#6ee7b7',
            colorAnnouncement: '#059669', colorAnnouncementText: '#ffffff',
            colorBg: '#f0fdf4', colorSurface: '#ffffff', colorBorder: '#d1fae5',
            darkMode: false,
        },
        accent: '#059669',
    },
    {
        name: 'Rose Bold',
        theme: {
            colorAccent: '#e11d48', colorAccentHover: '#be123c',
            colorHeader: '#ffffff', colorHeaderText: '#0f172a',
            colorFooter: '#881337', colorFooterText: '#fda4af',
            colorAnnouncement: '#e11d48', colorAnnouncementText: '#ffffff',
            colorBg: '#fff1f2', colorSurface: '#ffffff', colorBorder: '#fecdd3',
            darkMode: false,
        },
        accent: '#e11d48',
    },
    {
        name: 'Amber Warm',
        theme: {
            colorAccent: '#d97706', colorAccentHover: '#b45309',
            colorHeader: '#fffbeb', colorHeaderText: '#0f172a',
            colorFooter: '#78350f', colorFooterText: '#fcd34d',
            colorAnnouncement: '#d97706', colorAnnouncementText: '#ffffff',
            colorBg: '#fffbeb', colorSurface: '#ffffff', colorBorder: '#fde68a',
            darkMode: false,
        },
        accent: '#d97706',
    },
    {
        name: 'Dark Night',
        theme: {
            colorAccent: '#6366f1', colorAccentHover: '#4f46e5',
            colorHeader: '#1e293b', colorHeaderText: '#f1f5f9',
            colorFooter: '#020617', colorFooterText: '#64748b',
            colorAnnouncement: '#1e293b', colorAnnouncementText: '#a5b4fc',
            colorBg: '#0f172a', colorSurface: '#1e293b', colorBorder: '#334155',
            colorTextPrimary: '#f1f5f9', colorTextSecondary: '#94a3b8', colorTextMuted: '#64748b',
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

// ── Colour picker row ─────────────────────────────────────────────────────────
const ColorRow = ({ label, value, onChange, description }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <div
            className="w-9 h-9 rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden cursor-pointer shadow-sm relative"
            title={label}
        >
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label={label}
            />
            <div className="w-full h-full rounded-xl" style={{ backgroundColor: value }} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
            {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-24 text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-gray-50"
            placeholder="#000000"
        />
    </div>
);

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

// ── Main ThemeEditor ──────────────────────────────────────────────────────────
const ThemeEditor = ({ theme, onChange }) => {
    const [activePreset, setActivePreset] = useState(null);

    const set = (key, value) => onChange({ ...theme, [key]: value });

    const applyPreset = (preset) => {
        setActivePreset(preset.name);
        onChange({ ...theme, ...preset.theme });
    };

    // Live preview: apply to CSS vars in real time as admin changes them
    const handleColorChange = (key, value) => {
        // Apply immediately for live preview
        const cssVarMap = {
            colorAccent:           '--color-accent',
            colorAccentHover:      '--color-accent-hover',
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
        };
        if (cssVarMap[key]) {
            document.documentElement.style.setProperty(cssVarMap[key], value);
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
                <ColorRow label="Accent Hover"       value={theme.colorAccentHover}  onChange={(v) => handleColorChange('colorAccentHover', v)}  description="Button hover state" />
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
                <SelectRow label="Body Font"    value={theme.fontBody}    options={FONT_BODY_OPTIONS}    onChange={(v) => { document.documentElement.style.setProperty('--font-body', v); set('fontBody', v); }} />
                <SelectRow label="Display Font" value={theme.fontDisplay} options={FONT_DISPLAY_OPTIONS} onChange={(v) => { document.documentElement.style.setProperty('--font-display', v); set('fontDisplay', v); }} />
                <SelectRow label="Font Scale"   value={theme.fontScale}   options={FONT_SCALE_OPTIONS}   onChange={(v) => { document.documentElement.style.setProperty('--font-scale', v); set('fontScale', v); }} />
            </Section>

            {/* ── Layout & Shape ── */}
            <Section icon={<DashboardIcon sx={{ fontSize: 18 }} />} title="Layout & Shape">
                <SelectRow label="Button Radius"   value={theme.btnRadius}       options={BTN_RADIUS_OPTIONS}   onChange={(v) => { document.documentElement.style.setProperty('--btn-radius', v); set('btnRadius', v); }} />
                <SelectRow label="Card Radius"     value={theme.cardRadius}      options={CARD_RADIUS_OPTIONS}  onChange={(v) => { document.documentElement.style.setProperty('--card-radius', v); set('cardRadius', v); }} />
                <SelectRow label="Container Width" value={theme.containerWidth}  options={CONTAINER_OPTIONS}    onChange={(v) => { document.documentElement.style.setProperty('--container-width', v); set('containerWidth', v); }} />
            </Section>

        </div>
    );
};

export default ThemeEditor;
