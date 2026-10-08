
const FormSidebar = ({ title, tag }) => {
    return (
        <div className="loginSidebar bg-gradient-to-br from-primary-accent via-indigo-600 to-blue-700 px-6 sm:px-9 py-8 sm:py-10 flex sm:flex flex-col justify-between gap-4 w-full sm:w-2/5 relative order-2 sm:order-1 text-center sm:text-left">
            <div className="absolute inset-0 opacity-25 pointer-events-none" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.3), transparent 65%)' }}></div>
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                <h1 className="font-display font-bold text-white text-2xl sm:text-4xl leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{title}</h1>
                <p className="text-white/95 text-sm sm:text-lg pr-0 sm:pr-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">{tag}</p>
            </div>
            <div className="relative z-10 text-xs text-white/90 hidden sm:block drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">Shop smarter. Track faster.</div>
        </div>
    )
}

export default FormSidebar
