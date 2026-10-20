import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveAddress, myAddresses, clearErrors } from '../../actions/userAction';
import { BD_DIVISIONS, getDistricts, getAreas } from '../../utils/bdLocations';
import { useSnackbar } from 'notistack';

import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import PinDropIcon from '@mui/icons-material/PinDrop';
import StarIcon from '@mui/icons-material/Star';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

const LABELS = [
    { key: 'Home', icon: HomeIcon, tint: 'var(--color-accent)' },
    { key: 'Office', icon: WorkIcon, tint: '#1d4ed8' },
    { key: 'Other', icon: PlaceIcon, tint: '#16a34a' },
];

const field = (withIcon = false) => ({
    width: '100%',
    padding: withIcon ? '0.625rem 0.75rem 0.625rem 2.5rem' : '0.625rem 0.75rem',
    fontSize: '0.8125rem',
    borderRadius: '0.625rem',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
});

const inputFocusHandlers = {
    onFocus: (e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)';
    },
    onBlur: (e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
    },
};

const Label = ({ children, icon }) => (
    <span className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
        {children}
    </span>
);

const Field = ({ label, icon, children, span }) => (
    <label className={`block ${span ? 'sm:col-span-' + span : ''}`}>
        <Label icon={icon}>{label}</Label>
        {children}
    </label>
);

const IconWrap = ({ children }) => (
    <span
        className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
        style={{ color: 'var(--color-text-muted)' }}
    >
        {children}
    </span>
);

// Add / edit a saved delivery address. Mirrors the checkout fields so a saved
// address can be reused there without translation.
const AddressForm = ({ initial, onDone }) => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { loading } = useSelector((state) => state.addressSave);

    const [form, setForm] = useState({
        fullName: initial?.fullName || '',
        phoneNo: initial?.phoneNo || '',
        address: initial?.address || '',
        division: initial?.division || '',
        city: initial?.city || '',
        area: initial?.area || '',
        pincode: initial?.pincode || '',
        label: initial?.label || 'Home',
        isDefault: Boolean(initial?.isDefault),
    });

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const onDivision = (e) => setForm((f) => ({ ...f, division: e.target.value, city: '', area: '' }));
    const onDistrict = (e) => setForm((f) => ({ ...f, city: e.target.value, area: '' }));

    const districts = getDistricts(form.division);
    const areas = getAreas(form.division, form.city);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.address.trim() || !form.city.trim()) {
            enqueueSnackbar('Address and district are required', { variant: 'warning' });
            return;
        }
        const payload = {
            fullName: form.fullName,
            phoneNo: form.phoneNo,
            address: form.address,
            city: form.city,
            state: form.division || form.city,
            pincode: form.pincode,
            country: 'Bangladesh',
            label: form.label,
            isDefault: form.isDefault,
        };
        const res = await dispatch(saveAddress(payload, initial?._id));
        if (res?.type?.endsWith('FAIL')) {
            const msg = res.payload || 'Could not save the address';
            enqueueSnackbar(msg, { variant: 'error' });
            dispatch(clearErrors());
            return;
        }
        dispatch(myAddresses());
        onDone?.(true);
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-4 p-4 sm:p-5"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--card-radius)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            {/* ── form header ── */}
            <div className="flex items-center gap-2.5">
                <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                >
                    {initial ? <EditIcon sx={{ fontSize: 18 }} /> : <LocationOnIcon sx={{ fontSize: 18 }} />}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {initial ? 'Edit Address' : 'Add a new address'}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        {initial ? 'Update your saved delivery address' : 'Save an address for faster checkout'}
                    </p>
                </div>
            </div>

            {/* ── label chips ── */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    Address type
                </span>
                {LABELS.map((l) => {
                    const Icon = l.icon;
                    const active = form.label === l.key;
                    return (
                        <button
                            key={l.key}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, label: l.key }))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
                            style={active
                                ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }
                                : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; } }}
                            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
                        >
                            <Icon sx={{ fontSize: 14, color: active ? '#fff' : l.tint }} />
                            {l.key}
                        </button>
                    );
                })}
            </div>

            {/* ── name + phone ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name">
                    <div className="relative">
                        <IconWrap><PersonIcon sx={{ fontSize: 15 }} /></IconWrap>
                        <input style={field(true)} value={form.fullName} onChange={set('fullName')} placeholder="Receiver's name" {...inputFocusHandlers} />
                    </div>
                </Field>
                <Field label="Mobile Number">
                    <div className="relative">
                        <IconWrap><PhoneIcon sx={{ fontSize: 15 }} /></IconWrap>
                        <input style={field(true)} value={form.phoneNo} onChange={set('phoneNo')} placeholder="01XXXXXXXXX" inputMode="tel" {...inputFocusHandlers} />
                    </div>
                </Field>
            </div>

            {/* ── address line ── */}
            <Field label="Address (house, road, area)">
                <div className="relative">
                    <IconWrap><LocationOnIcon sx={{ fontSize: 15 }} /></IconWrap>
                    <input style={field(true)} value={form.address} onChange={set('address')} placeholder="House 12, Road 5, Block C" {...inputFocusHandlers} />
                </div>
            </Field>

            {/* ── division / district / area ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Division">
                    <div className="relative">
                        <IconWrap><MapIcon sx={{ fontSize: 15 }} /></IconWrap>
                        <select style={field(true)} value={form.division} onChange={onDivision} {...inputFocusHandlers}>
                            <option value="">Select division</option>
                            {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </Field>
                <Field label="District">
                    <div className="relative">
                        <IconWrap><LocationOnIcon sx={{ fontSize: 15 }} /></IconWrap>
                        <select style={field(true)} value={form.city} onChange={onDistrict} disabled={!form.division} {...inputFocusHandlers}>
                            <option value="">{form.division ? 'Select district' : 'Select division first'}</option>
                            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </Field>
                <Field label="Area / Thana">
                    <div className="relative">
                        <IconWrap><PinDropIcon sx={{ fontSize: 15 }} /></IconWrap>
                        <select style={field(true)} value={form.area} onChange={set('area')} disabled={!form.city} {...inputFocusHandlers}>
                            <option value="">{form.city ? 'Optional' : 'Select district first'}</option>
                            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </Field>
            </div>

            {/* ── postcode ── */}
            <Field label="Postcode" span={1}>
                <div className="relative sm:max-w-[12rem]">
                    <IconWrap><PinDropIcon sx={{ fontSize: 15 }} /></IconWrap>
                    <input style={field(true)} value={form.pincode} onChange={set('pincode')} placeholder="1207" inputMode="numeric" {...inputFocusHandlers} />
                </div>
            </Field>

            {/* ── default toggle ── */}
            <label
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer select-none transition-all duration-150"
                style={{
                    backgroundColor: form.isDefault ? 'var(--color-accent-light)' : 'var(--color-bg)',
                    border: `1px solid ${form.isDefault ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
            >
                <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                        backgroundColor: form.isDefault ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: form.isDefault ? '#fff' : 'var(--color-text-muted)',
                        border: form.isDefault ? 'none' : '1px solid var(--color-border)',
                    }}
                >
                    <StarIcon sx={{ fontSize: 16 }} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Set as default address</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Used automatically at checkout
                    </p>
                </div>
                <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="sr-only"
                />
            </label>

            {/* ── actions ── */}
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                    <SaveIcon sx={{ fontSize: 16 }} />
                    {loading ? 'Saving…' : (initial ? 'Update Address' : 'Save Address')}
                </button>
                <button
                    type="button"
                    onClick={() => onDone?.(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default AddressForm;