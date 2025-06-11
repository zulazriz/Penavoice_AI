// import AppLogoIcon from './app-logo-icon';
import { Mic } from 'lucide-react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

export default function AppLogo() {
    return (
        <>
            {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div> */}

            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <Mic className="h-5 w-5 text-white" />
            </div>

            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">{appName}</span>
            </div>
        </>
    );
}
