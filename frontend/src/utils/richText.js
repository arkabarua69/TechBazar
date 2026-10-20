// Renders admin-authored rich text (react-quill HTML) on the storefront.
//
// Legacy values are plain text, so we escape them first and only treat the
// result as HTML when it actually looks like markup. That keeps old content
// rendering exactly as before while allowing formatted copy.

const escapeHtml = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const hasMarkup = (s) => /<\/?(p|br|h[1-6]|ul|ol|li|strong|em|b|i|u|s|a|blockquote|span|div)\b/i.test(String(s));

// Plain text → <p> blocks (respecting existing line breaks).
const toHtml = (value) => {
    const v = value == null ? '' : String(value);
    if (!v.trim()) return '';
    if (hasMarkup(v)) return v;
    return v
        .split(/\n{2,}/)
        .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br />')}</p>`)
        .join('');
};

// Safe subset: strip script/style/iframe and inline event handlers.
const sanitize = (html) =>
    String(html)
        .replace(/<\s*(script|style|iframe|object|embed|form|input)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<\s*(script|style|iframe|object|embed|form|input)\b[^>]*\/?>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');

export const richTextToHtml = (value) => sanitize(toHtml(value));

// Inline variant: rich text that sits inside a sentence/heading. Strips the
// outer <p> wrappers so the markup doesn't create a block element.
export const richTextToInlineHtml = (value) => {
    const html = sanitize(toHtml(value));
    return html
        .replace(/^\s*<p>(.*?)<\/p>\s*$/is, '$1')
        .replace(/<\/p>\s*<p>/gi, '<br />');
};

export default richTextToHtml;
