import { useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';

const Stepper = ({ activeStep, children }) => {
    const { user } = useSelector((state) => state.user);
    const { shippingInfo, cartItems } = useSelector((state) => state.cart);

    const address = shippingInfo
        ? [shippingInfo.address, shippingInfo.city, shippingInfo.state, shippingInfo.pincode]
            .filter(Boolean).join(', ')
        : '';

    const steps = [
        {
            label: 'LOGIN',
            desc: (
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}{' '}
                    <span className="font-normal" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</span>
                </p>
            ),
        },
        {
            label: 'DELIVERY ADDRESS',
            desc: (
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}{' '}
                    <span className="font-normal" style={{ color: 'var(--color-text-secondary)' }}>{address}</span>
                </p>
            ),
        },
        {
            label: 'ORDER SUMMARY',
            desc: (
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {cartItems.length} Item{cartItems.length !== 1 ? 's' : ''}
                </p>
            ),
        },
        {
            label: 'PAYMENT',
            desc: <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mobile Banking / COD</p>,
        },
    ];

    return (
        <div className="flex flex-col gap-3">
            {steps.map((step, index) => {
                const isActive = activeStep === index;
                const isDone = activeStep > index;

                return (
                    <div key={index}>
                        {isActive ? (
                            <div className="surface overflow-hidden">
                                {/* Active step header */}
                                <div
                                    className="flex items-center px-5 sm:px-6 py-3 gap-3"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                >
                                    <span
                                        className="h-6 w-6 flex items-center justify-center text-xs font-bold rounded-lg shrink-0"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }}
                                    >
                                        {index + 1}
                                    </span>
                                    <h2 className="font-bold text-white text-sm sm:text-base">{step.label}</h2>
                                </div>
                                {children}
                            </div>
                        ) : (
                            <div className="surface flex items-start px-4 py-3 gap-3">
                                <span
                                    className="mt-1 h-5 w-5 flex items-center justify-center text-xs font-bold rounded-lg shrink-0"
                                    style={{
                                        backgroundColor: isDone ? 'rgba(232,75,15,0.1)' : 'var(--color-bg)',
                                        color: isDone ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    }}
                                >
                                    {index + 1}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <h2
                                        className="font-semibold text-sm flex items-center gap-2"
                                        style={{ color: isDone ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                                    >
                                        {step.label}
                                        {isDone && (
                                            <CheckIcon sx={{ fontSize: 18, color: 'var(--color-success)' }} />
                                        )}
                                    </h2>
                                    {isDone && step.desc}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Stepper;
