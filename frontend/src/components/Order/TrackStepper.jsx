import { Step, StepLabel, Stepper } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { formatDate } from '../../utils/functions';

const TrackStepper = ({ activeStep, orderOn, shippedAt, deliveredAt }) => {

    const steps = [
        {
            status: "Ordered",
            dt: formatDate(orderOn),
        },
        {
            status: "Shipped",
            dt: formatDate(shippedAt),
        },
        {
            status: "Delivered",
            dt: formatDate(deliveredAt),
        },
    ];

    const stepIcon = (index) => {
        const isDone = activeStep > index;
        const isActive = activeStep === index;
        return (
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                isDone
                    ? "bg-primary-green text-white"
                    : isActive
                        ? "bg-primary-accent text-white animate-pulse"
                        : "bg-white border border-line text-slate-400"
            }`}>
                <CircleIcon sx={{ fontSize: "14px" }} />
            </span>
        );
    };

    const labelColor = (index) => (activeStep === index ? "text-primary-accent" : "text-primary-green");

    return (
        <Stepper
            activeStep={activeStep}
            alternativeLabel
            connector={<span className="bg-line absolute top-[11px] left-[calc(-50%_+_20px)] right-[calc(50%_+_20px)] h-0.5" />}
        >
            {steps.map((item, index) => (
                <Step
                    key={index}
                    active={activeStep === index ? true : false}
                    completed={activeStep >= index ? true : false}
                >
                    <StepLabel
                        icon={stepIcon(index)}
                    >
                        {activeStep >= index ? (
                            <div className="flex flex-col">
                                <span className={`text-xs font-medium ${labelColor(index)}`}>{item.status}</span>
                                {item.dt !== "Invalid Date" && (
                                    <span className={`text-xs font-medium ${labelColor(index)}`}>{item.dt}</span>
                                )}
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs font-medium">{item.status}</span>
                        )}
                    </StepLabel>
                </Step>
            ))}
        </Stepper>
    );
};

export default TrackStepper;
