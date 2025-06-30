// resources/js/app.tsx

import '../css/app.css';

import { CreditProvider } from '@/contexts/CreditContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { UploadedFilesProvider } from '@/contexts/UploadedFilesContext';
import { initializeTheme } from '@/hooks/use-appearance';
import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// --- CRITICAL AXIOS DEFAULT CONFIGURATION ---
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

// --- CRITICAL CSRF COOKIE FETCH BEFORE APP MOUNTS ---
axios
    .get('/sanctum/csrf-cookie')
    .then(() => {
        createInertiaApp({
            title: (title) => `${title} - ${appName}`,
            resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
            setup({ el, App, props }) {
                const root = createRoot(el);
                root.render(
                    <UploadedFilesProvider>
                        <NotificationProvider>
                            <CreditProvider>
                                <App {...props} />
                            </CreditProvider>
                        </NotificationProvider>
                    </UploadedFilesProvider>,
                );
            },
            progress: {
                color: '#4B5563',
            },
        });
    })
    .catch((error) => {
        console.error('Failed to get CSRF cookie:', error);
        alert('Application startup error: Please try again. (Could not establish secure connection)');
    });

initializeTheme();
