import { Component } from 'react';

/**
 * Last line of defence against a white screen.
 *
 * The app has no server-side rendering: if any component throws during render
 * or in a lifecycle, React unmounts the whole tree and the visitor is left with
 * a blank page and no way to recover. This boundary catches the error, shows a
 * friendly message and offers a reload instead.
 *
 * It sits above <App /> in index.js so it also covers the header, footer and
 * router — anything that renders outside a page component.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        // Keep the details in the console for debugging; never block rendering.
        console.error('Unhandled UI error:', error, errorInfo?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg, #fafbfc)' }}>
                <div className="surface max-w-md w-full p-8 sm:p-12 text-center flex flex-col gap-4 rounded-lg">
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-danger, #dc2626)' }}>
                        Something went wrong
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary, #475569)' }}>
                        An unexpected error occurred while showing this page. Your data is safe —
                        reload to continue shopping.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.assign('/')}
                        className="btn-accent px-6 py-3 text-sm font-bold uppercase rounded-lg"
                    >
                        Reload site
                    </button>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
