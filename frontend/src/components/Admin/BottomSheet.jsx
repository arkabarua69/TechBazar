import CloseIcon from '@mui/icons-material/Close';

// Native-app style bottom sheet: slides up from the bottom, no page refresh,
// no browser popup. Tap the backdrop or ✕ to dismiss.
const BottomSheet = ({ open, onClose, title, children }) => {
    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose}></div>
            <div
                className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(15,23,42,0.25)] max-h-[86vh] flex flex-col tb-sheet"
                role="dialog"
                aria-modal="true"
            >
                <style>{`
                    @keyframes tb-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    .tb-sheet { animation: tb-sheet-up .28s cubic-bezier(.22,.9,.3,1); }
                    @media (prefers-reduced-motion: reduce) { .tb-sheet { animation: none; } }
                `}</style>

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
        </>
    );
};

export default BottomSheet;
