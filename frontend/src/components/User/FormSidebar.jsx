// Sidebar panel for auth forms (Login / Register).
// Matches the reference image: orange-red gradient left panel with
// illustration area, title, and tagline.
const FormSidebar = ({ title, tag }) => (
    <div
        className="px-6 sm:px-9 py-8 sm:py-10 flex flex-col justify-between gap-4 w-full sm:w-2/5 relative overflow-hidden order-2 sm:order-1"
        style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)',
        }}
    >
        {/* Subtle geometric circles in background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 border-white/10" />
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full border border-white/15" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border-2 border-white/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4 text-center sm:text-left">
            <h1 className="font-bold text-white text-2xl sm:text-3xl leading-tight">{title}</h1>
            <p className="text-white/90 text-sm sm:text-base">{tag}</p>
        </div>

        <div className="relative z-10 text-xs text-white/70 hidden sm:block">
            Shop smarter. Track faster.
        </div>
    </div>
);

export default FormSidebar;
