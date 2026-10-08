import { useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';

const Stepper = ({ activeStep, children }) => {

    const { user } = useSelector((state) => state.user);
    const { shippingInfo, cartItems } = useSelector((state) => state.cart);

    const address = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}`;

    const steps = [
        {
            label: "LOGIN",
            desc: <p className="font-medium text-sm text-slate-600">{user.name} <span className="text-sm font-normal text-slate-500">{user.email}</span></p>
        },
        {
            label: "DELIVERY ADDRESS",
            desc: <p className="font-medium text-sm text-slate-600">{user.name} <span className="text-sm font-normal text-slate-500">{address}</span></p>
        },
        {
            label: "ORDER SUMMARY",
            desc: <p className="font-medium text-sm text-slate-600">{cartItems.length} Item</p>
        },
        {
            label: "PAYMENT OPTIONS",
            desc: <p className="font-medium text-sm text-slate-600">Paytm</p>
        }
    ]

    return (
        <div className="flex flex-col gap-4">

            {steps.map((step, index) => {

                return (
                    <>
                        {activeStep === index ? (
                            <div className="surface flex flex-col overflow-hidden">
                                <div className="flex items-center bg-primary-accent px-6 py-3 gap-4">
                                    <span className="h-5 w-5 flex items-center justify-center text-xs font-bold bg-blue-50 text-primary-accent rounded-lg">{index + 1}</span>
                                    <h2 className="font-display font-bold text-white text-base sm:text-lg">{step.label}</h2>
                                </div>
                                {children}
                            </div>
                        ) : (
                            <>
                                {activeStep > index ? (
                                    <Step isDesc={true} {...step} index={index} />
                                ) : (
                                    <Step isDesc={false} {...step} index={index} />
                                )}
                            </>
                        )}
                    </>
                )
            })}

        </div>
    );
};

const Step = ({ isDesc, label, desc, index }) => {
    return (
        <div className="surface flex px-4 py-3 pb-4">
            <span className="mt-2 ml-2 mr-4 h-5 w-5 flex items-center justify-center text-xs font-bold bg-blue-50 text-primary-accent rounded-lg">{index + 1}</span>
            <div className="flex flex-col mt-1 gap-0.5">
                <h2 className={`font-medium flex items-center gap-2 ${isDesc ? "text-slate-700" : "text-slate-400"}`}>{label}
                    {isDesc && (
                        <span className="text-primary-green mb-1"><CheckIcon sx={{ fontSize: "20px" }} /></span>
                    )}
                </h2>
                {isDesc && desc}
            </div>
        </div>
    )
}

export default Stepper;
