// "How to Order?" — 3 simple steps for Bangladeshi customers
const HowToOrder = ({ steps = [] }) => {
    if (!steps.length) return null;

    return (
        <section className="surface p-5 sm:p-7">
            <div className="text-center mb-6">
                <h2 className="section-title">How to Order?</h2>
                <p className="section-tagline mt-1">Complete your order in just 3 simple steps</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {steps.map((step, i) => (
                    <div key={i} className="relative bg-cloud border border-line rounded-xl p-5 flex flex-col items-center text-center gap-2">
                        <span className="absolute -top-3 left-4 w-7 h-7 rounded-full bg-primary-accent text-white text-xs font-bold flex items-center justify-center shadow">
                            {i + 1}
                        </span>
                        <span className="text-3xl">{step.icon}</span>
                        <p className="font-display font-semibold text-slate-900 text-sm sm:text-base">{step.title}</p>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowToOrder;
