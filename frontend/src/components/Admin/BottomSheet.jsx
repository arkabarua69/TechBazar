import CloseIcon from '@mui/icons-material/Close';

// Responsive dialog:
//   • mobile  → native-app style bottom sheet (slides up from the bottom)
//   • desktop → centred popup/modal card
// Tap the backdrop or the close button to dismiss. No browser popup, no refresh.
const BottomSheet = ({ open, onClose, title, children }) => {
    if (!open) return null;

    return (
        <>
            <style>{`
                @keyframes tb-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes tb-modal-in { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .tb-sheet { animation: tb-sheet-up .28s cubic-bezier(.22,.9,.3,1); }
                .tb-modal { animation: tb-modal-in .2s cubic-bezier(.22,.9,.3,1); }
                @media (prefers-reduced-motion: reduce) { .tb-sheet, .tb-modal { animation: none; } }
            `}</style>

            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}></div>

            {/* ── mobile: bottom sheet ─────────────────────────────── */}
            <div
                className="tb-sheet sm:hidden fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(15,23,42,0.25)] max-h-[86vh] flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {/* grab handle + header */}
                <div className="pt-2 pb-1 flex justify-center">
                    <span className="w-10 h-1.5 rounded-full bg-gray-300"></span>
                </div>
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                    >
                        <CloseIcon sx={{ fontSize: '18px' }} />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
            </div>

            {/* ── desktop: centred popup ───────────────────────────── */}
            <div
                className="tb-modal hidden sm:flex fixed inset-0 z-[61] items-center justify-center p-6 pointer-events-none"
                role="dialog"
                aria-modal="true"
            >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto ring-1 ring-black/5">
                    {/* header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition"
                        >
                            <CloseIcon sx={{ fontSize: '18px' }} />
                        </button>
                    </div>
                    {/* body */}
                    <div className="overflow-y-auto p-5">{children}</div>
                </div>
            </div>
        </>
    );
};

export default BottomSheet;
