import StarIcon from '@mui/icons-material/Star';
import SectionHeader from './SectionHeader';

// Customer reviews / social proof — real districts, star ratings
const Reviews = ({ reviews = [] }) => {
    if (!reviews.length) return null;

    const initials = (name = '') => name.trim().slice(0, 1) || '★';

    return (
        <section>
            <SectionHeader
                title="সন্তুষ্ট কাস্টমারদের মতামত"
                tagline="বিভিন্ন জেলা থেকে আসল ক্রেতাদের রিভিউ"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review, i) => (
                    <figure key={i} className="surface p-5 flex flex-col gap-3 hover:shadow-md transition duration-200">
                        <div className="flex items-center gap-1 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, s) => (
                                <StarIcon key={s} sx={{ fontSize: '16px', opacity: s < (Number(review.rating) || 5) ? 1 : 0.25 }} />
                            ))}
                        </div>

                        <blockquote className="text-sm text-slate-600 leading-relaxed flex-1">
                            “{review.comment}”
                        </blockquote>

                        <figcaption className="flex items-center gap-3 border-t border-line pt-3">
                            <span className="w-9 h-9 rounded-full bg-primary-accent/10 text-primary-accent font-display font-bold text-sm flex items-center justify-center">
                                {initials(review.name)}
                            </span>
                            <span className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800">{review.name}</span>
                                <span className="text-xs text-slate-500">{review.district}</span>
                            </span>
                            <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                যাচাইকৃত ক্রেতা
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
};

export default Reviews;
