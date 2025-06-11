// import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { Mic } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="mb-5 flex flex-col items-center gap-4">
                        {/* <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div> */}

                        <Link href={route('home')} className="mb-6 flex items-center justify-center space-x-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                                <Mic className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{appName}</span>
                        </Link>
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
