import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LanguageProvider } from './i18n/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import SnackbarBridge from './components/Layouts/SnackbarBridge';

// Match MUI components (forms, DataGrid, buttons) to the site's `primary-blue`
const theme = createTheme({
    palette: {
        primary: { main: '#3b82f6' },
    },
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
         <SnackbarProvider
           maxSnack={2}
           anchorOrigin={{
             vertical: 'top',
             horizontal: 'center',
           }}
           classes={{ containerRoot: 'site-snackbar-container' }}
         >
           <LanguageProvider>
             <SnackbarBridge>
             <Router>
               <ThemeProvider theme={theme}>
                 {/* Catches render errors anywhere in the app — without it a single thrown error blanks the entire page. */}
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
               </ThemeProvider>
             </Router>
             </SnackbarBridge>
           </LanguageProvider>
         </SnackbarProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);