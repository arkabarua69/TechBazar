import { useEffect } from 'react';
import { useSnackbar } from 'notistack';

// Bridge: expose notistack's closeSnackbar globally so non-React code (e.g. the
// app-wide click-to-dismiss handler in App.js) can dismiss snackbars.
const SnackbarBridge = ({ children }) => {
    const { closeSnackbar } = useSnackbar();
    useEffect(() => {
        window.__closeSnackbar = closeSnackbar;
        return () => { delete window.__closeSnackbar; };
    }, [closeSnackbar]);
    return children;
};

export default SnackbarBridge;
