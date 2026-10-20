import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Shared rich-text editor for the admin panel.
// Placed on every multi-line admin field so section copy (policy, FAQ answers,
// product descriptions, footer notes …) can be formatted instead of plain text.
//
// Value contract: the parent keeps whatever string it already used. When the
// stored value is plain text (legacy data) we pass it straight through — Quill
// renders it as a single paragraph. When it is HTML (minus a bare `<p></p>`)
// the formatting round-trips unchanged.

const isBlankHtml = (html) => {
    const v = String(html ?? '');
    if (v === '' || v === '<p><br></p>' || v === '<p></p>') return true;
    // Non-text media (images, video, embeds) counts as content even if the
    // visible text is empty.
    const hasMedia = /<(img|iframe|video|audio)\b/i.test(v);
    return v.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim() === '' && !hasMedia;
};

const RichTextEditor = ({
    label,
    value,
    onChange,
    placeholder = '',
    minHeight = 140,
    error = false,
    className = '',
}) => {
    // Quill emits an empty paragraph when the field is cleared. Normalise that
    // back to '' so required-field validation and "is empty" checks still work.
    const handleChange = (html) => {
        onChange(isBlankHtml(html) ? '' : html);
    };

    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['blockquote', 'link'],
                ['clean'],
            ],
        }),
        []
    );

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet',
        'align',
        'blockquote', 'link',
    ];

    return (
        <div className={`rte-field ${className}`}>
            {label ? <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label> : null}
            <div className={error ? 'rte-error' : ''}>
                <ReactQuill
                    theme="snow"
                    value={value || ''}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    style={{ '--rte-min-height': `${minHeight}px` }}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
