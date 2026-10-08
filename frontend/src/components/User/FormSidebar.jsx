
const FormSidebar = ({ title, tag }) => {
    return (
        <div className="loginSidebar bg-gradient-to-br from-primary-accent via-indigo-600 to-blue-700 px-9 py-10 hidden sm:flex flex-col justify-between gap-4 w-2/5 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top right, white, transparent 60%)' }}></div>
            <div className="relative flex flex-col gap-4">
                <h1 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight">{title}</h1>
                <p className="text-blue-100 text-base sm:text-lg pr-2">{tag}</p>
            </div>
            <div className="relative text-xs text-blue-100/90">Shop smarter. Track faster.</div>
        </div>
    )
}

export default FormSidebar
