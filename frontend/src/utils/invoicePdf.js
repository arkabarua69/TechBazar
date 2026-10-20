// Invoice PDF builder for the storefront order-details page.
//
// Uses jsPDF directly (no html2canvas) so the output is a real vector PDF —
// crisp text at any zoom, small file size, and no dependency on the DOM
// rendering of the page.
//
// Layout (A4, mm):
//   ┌──────────────────────────────────────────────┐
//   │ brand + INVOICE            invoice meta box  │
//   │ ──────────────────────────────────────────── │
//   │ billed-to panel        │  order info panel   │
//   │ ──────────────────────────────────────────── │
//   │ items table (#, item, qty, unit, amount)     │
//   │ ──────────────────────────────────────────── │
//   │ totals box (right aligned)  │ payment/track   │
//   │ ──────────────────────────────────────────── │
//   │ footer: thank-you + support hotline           │
//   └──────────────────────────────────────────────┘

import { jsPDF } from 'jspdf';

const ACCENT = [232, 75, 15];      // --color-accent #E84B0F
const DARK = [45, 27, 14];         // --color-text-primary
const MUTED = [122, 92, 72];       // --color-text-secondary
const LIGHT = [184, 147, 122];     // --color-text-muted
const LINE = [240, 226, 214];      // soft hairline (matches the on-screen sheet)
const SOFT = [253, 243, 236];      // warm panel fill
const PANEL = [255, 251, 247];     // near-white panel fill

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;                       // page margin
const CONTENT_W = PAGE_W - M * 2;   // 182

// jsPDF's built-in Helvetica cannot render ৳ or — safely, so normalise.
// (Non-latin1 characters are dropped after the em-dash / quote normalisation.)
const txt = (v) => String(v ?? '')
    .replace(/৳/g, 'Tk ')
    .replace(/[—–]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\u0100-\uFFFF]/g, '');

const money = (n) => `Tk ${Number(n || 0).toLocaleString('en-US')}`;

const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return `${fmtDate(dt)}, ${dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

// Load the logo as a data URL so it can be embedded. Fails silently to null.
const loadLogo = (url) => new Promise((resolve) => {
    if (!url) return resolve(null);
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth;
                c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                resolve({ data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    } catch {
        resolve(null);
    }
});

const statusTint = (s) => {
    if (s === 'Delivered') return { bg: [220, 252, 231], fg: [22, 163, 74] };
    if (s === 'Shipped') return { bg: [254, 243, 199], fg: [180, 83, 9] };
    return { bg: [219, 234, 254], fg: [29, 78, 216] };
};

/**
 * Build and download the invoice PDF.
 *
 * @param {object} order   Order document (Order model shape).
 * @param {object} opts    { brandName, brandTagline, logoUrl, siteUrl, hotline, whatsapp, email }
 */
export const downloadInvoice = async (order, opts = {}) => {
    if (!order) return;

    const brand = txt(opts.brandName || 'GeForce HuB');
    const tagline = txt(opts.brandTagline || '');
    const siteUrl = txt(opts.siteUrl || '');
    const hotline = txt(opts.hotline || '');
    const whatsapp = txt(opts.whatsapp || '');
    const email = txt(opts.email || '');

    const logo = await loadLogo(opts.logoUrl);
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    const invoiceNo = txt(order.orderId || `#${String(order._id || '').slice(-8).toUpperCase()}`);
    const status = order.orderStatus || 'Processing';
    const tint = statusTint(status);

    // ───────────────────────────────────────────────────────────────
    // Header band
    // ───────────────────────────────────────────────────────────────
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PAGE_W, 3, 'F');

    let y = M + 2;

    // Logo / brand mark
    let brandX = M;
    if (logo) {
        const maxH = 12;
        const ratio = logo.w / logo.h;
        const h = Math.min(maxH, 12);
        const w = h * ratio;
        try {
            doc.addImage(logo.data, 'PNG', M, y, w, h);
            brandX = M + w + 3;
        } catch { /* ignore bad image */ }
    } else {
        doc.setFillColor(...ACCENT);
        doc.roundedRect(M, y, 11, 11, 2.4, 2.4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(brand.charAt(0).toUpperCase(), M + 5.5, y + 7.4, { align: 'center' });
        brandX = M + 14.5;
    }

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(brand, brandX, y + 5.2);

    if (tagline) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(...MUTED);
        doc.text(tagline, brandX, y + 9.6);
    }

    // Right: INVOICE title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(...ACCENT);
    doc.text('INVOICE', PAGE_W - M, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(...LIGHT);
    doc.text('Thank you for shopping with us', PAGE_W - M, y + 10.6, { align: 'right' });

    y += 16;

    // Divider
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.line(M, y, PAGE_W - M, y);
    y += 6;

    // ───────────────────────────────────────────────────────────────
    // Meta row: invoice no / date / payment / status
    // ───────────────────────────────────────────────────────────────
    const metaY = y;
    const metaW = CONTENT_W / 4;

    const metaItems = [
        { label: 'INVOICE NO.', value: invoiceNo },
        { label: 'ORDER DATE', value: fmtDate(order.createdAt) },
        { label: 'PAYMENT', value: order.paidAt ? 'Paid' : (order.paymentMethod || 'COD') },
    ];

    metaItems.forEach((m, i) => {
        const x = M + i * metaW;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...LIGHT);
        doc.text(m.label, x, metaY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text(txt(m.value), x, metaY + 4.6);
    });

    // Status pill (4th column)
    const pillW = 30;
    const pillX = M + 3 * metaW;
    doc.setFillColor(...tint.bg);
    doc.roundedRect(pillX, metaY - 3.4, pillW, 8.4, 4.2, 4.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...tint.fg);
    doc.text(txt(status).toUpperCase(), pillX + pillW / 2, metaY + 2, { align: 'center' });

    y = metaY + 12;

    // ───────────────────────────────────────────────────────────────
    // Billed to + Order info panels
    // ───────────────────────────────────────────────────────────────
    const panelH = 38;
    const colW = (CONTENT_W - 6) / 2;

    // Left panel — billed to
    doc.setFillColor(...SOFT);
    doc.roundedRect(M, y, colW, panelH, 2, 2, 'F');

    doc.setFillColor(...PANEL);
    doc.roundedRect(M + 1.2, y + 1.2, colW - 2.4, panelH - 2.4, 1.6, 1.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...ACCENT);
    doc.text('BILLED TO', M + 5, y + 8);

    const buyerName = txt(order.user?.name || order.shippingInfo?.fullName || 'Customer');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.6);
    doc.setTextColor(...DARK);
    doc.text(buyerName, M + 5, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);

    const ship = order.shippingInfo || {};
    const addrLines = [
        txt(ship.address || ''),
        [ship.city, ship.state].filter(Boolean).map(txt).join(', ') + (ship.pincode ? ` - ${txt(ship.pincode)}` : ''),
        txt(ship.country || 'Bangladesh'),
    ].filter((l) => l && l !== '-' && l.trim() && l.trim() !== 'Bangladesh-' && l.trim() !== '');

    let ay = y + 19.5;
    addrLines.forEach((l) => {
        const wrapped = doc.splitTextToSize(l, colW - 10);
        wrapped.slice(0, 2).forEach((w) => {
            if (ay < y + panelH - 11) { doc.text(w, M + 5, ay); ay += 3.6; }
        });
    });

    doc.setFontSize(7.6);
    doc.setTextColor(...LIGHT);
    const contactBits = [];
    if (ship.phoneNo) contactBits.push(`Ph: ${txt(ship.phoneNo)}`);
    if (order.user?.email) contactBits.push(txt(order.user.email));
    if (contactBits.length && ay < y + panelH - 4) {
        const joined = contactBits.join('  |  ');
        doc.text(doc.splitTextToSize(joined, colW - 10)[0], M + 5, y + panelH - 5.5);
    }

    // Right panel — order info
    const rx = M + colW + 6;
    doc.setFillColor(...SOFT);
    doc.roundedRect(rx, y, colW, panelH, 2, 2, 'F');
    doc.setFillColor(...PANEL);
    doc.roundedRect(rx + 1.2, y + 1.2, colW - 2.4, panelH - 2.4, 1.6, 1.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...ACCENT);
    doc.text('ORDER INFO', rx + 5, y + 8);

    const infoRows = [
        ['Order ID', invoiceNo],
        ['Placed on', fmtDateTime(order.createdAt)],
        ['Items', String((order.orderItems || []).length)],
        ['Payment', order.paidAt ? `Paid on ${fmtDate(order.paidAt)}` : `${order.paymentMethod || 'COD'} (pay on delivery)`],
    ];

    doc.setFontSize(8);
    let iy = y + 14.5;
    infoRows.forEach(([k, v]) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MUTED);
        doc.text(k, rx + 5, iy);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        const vv = doc.splitTextToSize(txt(v), colW - 40)[0] || '-';
        doc.text(vv, rx + colW - 5, iy, { align: 'right' });
        iy += 5.6;
    });

    y += panelH + 9;

    // ───────────────────────────────────────────────────────────────
    // Items table
    // ───────────────────────────────────────────────────────────────
    const colNum = 10;
    const colQty = 16;
    const colUnit = 30;
    const colAmt = 32;
    const colItem = CONTENT_W - colNum - colQty - colUnit - colAmt;

    const xNum = M;
    const xItem = xNum + colNum;
    const xQty = xItem + colItem;
    const xUnit = xQty + colQty;
    const xAmt = xUnit + colUnit;

    // Table header — light accent band to match the on-screen table.
    doc.setFillColor(253, 243, 236);
    doc.roundedRect(M, y, CONTENT_W, 9, 1.6, 1.6, 'F');
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, y + 9, PAGE_W - M, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(...MUTED);
    doc.text('#', xNum + 3, y + 6);
    doc.text('DESCRIPTION', xItem + 2, y + 6);
    doc.text('QTY', xQty + colQty - 3, y + 6, { align: 'right' });
    doc.text('UNIT PRICE', xUnit + colUnit - 3, y + 6, { align: 'right' });
    doc.text('AMOUNT', xAmt + colAmt - 3, y + 6, { align: 'right' });

    y += 9;

    // Rows
    let rowIndex = 0;
    (order.orderItems || []).forEach((item) => {
        const nameLines = doc.splitTextToSize(txt(item.name), colItem - 6);
        const nameH = Math.min(nameLines.length, 3) * 4;
        const rowH = Math.max(nameH + 5, 13);

        // page-break guard
        if (y + rowH > PAGE_H - 45) {
            doc.addPage();
            y = M;
        }

        if (rowIndex % 2 === 1) {
            doc.setFillColor(253, 243, 236);
            doc.rect(M, y, CONTENT_W, rowH, 'F');
        }

        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.2);
        doc.line(M, y + rowH, PAGE_W - M, y + rowH);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.4);
        doc.setTextColor(...LIGHT);
        doc.text(String(rowIndex + 1), xNum + 3, y + 7.6);

        doc.setFont('helvetica', 'semibold' in doc ? 'semibold' : 'bold');
        doc.setFontSize(8.6);
        doc.setTextColor(...DARK);
        nameLines.slice(0, 3).forEach((l, li) => doc.text(l, xItem + 2, y + 6 + li * 4));

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...MUTED);
        doc.setFontSize(8.4);
        doc.text(String(item.quantity || 1), xQty + colQty - 3, y + 7.6, { align: 'right' });
        doc.text(money(item.price), xUnit + colUnit - 3, y + 7.6, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(...ACCENT);
        doc.text(money((item.quantity || 1) * (item.price || 0)), xAmt + colAmt - 3, y + 7.6, { align: 'right' });

        y += rowH;
        rowIndex += 1;
    });

    y += 8;

    // ───────────────────────────────────────────────────────────────
    // Totals + tracking
    // ───────────────────────────────────────────────────────────────
    if (y > PAGE_H - 90) { doc.addPage(); y = M; }

    const totW = 78;
    const totX = PAGE_W - M - totW;

    // Left: order progress
    const steps = [
        { label: 'Ordered', at: order.createdAt, done: true },
        { label: 'Shipped', at: order.shippedAt, done: ['Shipped', 'Delivered'].includes(status) },
        { label: 'Delivered', at: order.deliveredAt, done: status === 'Delivered' },
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(...DARK);
    doc.text('ORDER PROGRESS', M, y + 2);

    let py = y + 9;
    steps.forEach((s) => {
        doc.setFillColor(...(s.done ? ACCENT : LINE));
        if (s.done) {
            doc.circle(M + 1.8, py - 1.2, 1.8, 'F');
        } else {
            doc.setDrawColor(...LINE);
            doc.setLineWidth(0.5);
            doc.circle(M + 1.8, py - 1.2, 1.8, 'S');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...(s.done ? DARK : LIGHT));
        doc.text(s.label, M + 6, py);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...LIGHT);
        doc.text(s.at ? fmtDateTime(s.at) : 'Pending', M + 26, py);
        py += 6.4;
    });

    // Right: totals card
    doc.setFillColor(...SOFT);
    doc.roundedRect(totX, y - 4, totW, 40, 2, 2, 'F');
    doc.setFillColor(...PANEL);
    doc.roundedRect(totX + 1.2, y - 2.8, totW - 2.4, 37.6, 1.6, 1.6, 'F');

    const itemsSubtotal = (order.orderItems || [])
        .reduce((s, i) => s + (i.quantity || 1) * (i.price || 0), 0);
    const total = Number(order.totalPrice || 0);
    const shipping = Math.max(0, total - itemsSubtotal);

    const line = (label, value, at, opts2 = {}) => {
        doc.setFont('helvetica', opts2.bold ? 'bold' : 'normal');
        doc.setFontSize(opts2.bold ? 9.4 : 8.4);
        doc.setTextColor(...(opts2.bold ? DARK : MUTED));
        doc.text(txt(label), totX + 5, at);
        doc.setTextColor(...(opts2.color || (opts2.bold ? DARK : DARK)));
        doc.text(txt(value), totX + totW - 5, at, { align: 'right' });
    };

    line('Subtotal (items)', money(itemsSubtotal), y + 4);
    if (shipping > 0) line('Delivery charge', money(shipping), y + 10);
    line('Items', String((order.orderItems || []).reduce((s, i) => s + (i.quantity || 1), 0)) + ' pcs', y + 16);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(totX + 5, y + 20, totX + totW - 5, y + 20);

    doc.setFillColor(...ACCENT);
    doc.roundedRect(totX + 3.5, y + 22.5, totW - 7, 11, 1.8, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL', totX + 6, y + 29.6);
    doc.setFontSize(11);
    doc.text(money(total), totX + totW - 6, y + 29.8, { align: 'right' });

    y += 48;

    // ───────────────────────────────────────────────────────────────
    // Footer
    // ───────────────────────────────────────────────────────────────
    if (y > PAGE_H - 26) { doc.addPage(); y = M; }

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.line(M, y, PAGE_W - M, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...DARK);
    doc.text('Thank you for your order!', M, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(...MUTED);
    doc.text(
        "Keep this invoice for warranty & replacement claims (7-day replacement guarantee).",
        M, y + 10.6
    );

    const footBits = [];
    if (hotline) footBits.push(`Hotline: ${hotline}`);
    if (whatsapp) footBits.push(`WhatsApp: ${whatsapp}`);
    if (email) footBits.push(email);
    if (siteUrl) footBits.push(siteUrl);
    if (footBits.length) {
        doc.setFontSize(7.2);
        doc.setTextColor(...ACCENT);
        doc.text(doc.splitTextToSize(footBits.join('   |   '), CONTENT_W)[0], M, y + 15.2);
    }

    // Page number
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...LIGHT);
        doc.text(`${brand}  -  Page ${p} of ${pages}`, PAGE_W / 2, PAGE_H - 7, { align: 'center' });
    }

    doc.save(`Invoice-${invoiceNo.replace(/[^\w-]/g, '')}.pdf`);
};

export default downloadInvoice;
