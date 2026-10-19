// Light skeleton placeholders shown while products are loading
const SkeletonGrid = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="surface overflow-hidden animate-pulse">
                    <div className="h-40 sm:h-44 bg-slate-100" />
                    <div className="p-4 flex flex-col gap-2">
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                        <div className="h-3 w-full bg-slate-100 rounded" />
                        <div className="h-3 w-2/3 bg-slate-100 rounded" />
                        <div className="h-4 w-24 bg-slate-100 rounded mt-1" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonGrid;
