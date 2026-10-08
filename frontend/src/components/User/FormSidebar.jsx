
const FormSidebar = ({ title, tag }) => {
    return (
        <div className="loginSidebar bg-primary-accent px-9 py-10 hidden sm:flex flex-col gap-4 w-2/5">
            <h1 className="font-display font-bold text-white text-3xl">{title}</h1>
            <p className="text-blue-100 text-lg pr-2">{tag}</p>
        </div>
    )
}

export default FormSidebar
