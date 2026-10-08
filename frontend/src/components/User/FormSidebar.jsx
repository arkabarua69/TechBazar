
const FormSidebar = ({ title, tag }) => {
    return (
        <div className="loginSidebar bg-gradient-to-br from-primary-accent via-indigo-600 to-blue-700 px-6 sm:px-9 py-8 sm:py-10 flex sm:flex flex-col justify-between gap-4 w-full sm:w-2/5 relative order-2 sm:order-1 text-center sm:text-left">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top right, white, transparent 60%)' }}></div>
            <div className="relative flex flex-col gap-3 sm:gap-4">
                <h1 className="font-display font-bold text-white text-2xl sm:text-4xl leading-tight">{title}</h1>
                <p className="text-blue-100 text-sm sm:text-lg pr-0 sm:pr-2">{tag}</p>
            </div>
            <div className="relative text-xs text-blue-100/90 hidden sm:block">Shop smarter. Track faster.</div>
        </div>
    )
}

export default FormSidebar
