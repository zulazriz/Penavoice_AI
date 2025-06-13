// import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Holidays from 'date-holidays';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CreditCard, FileText, TrendingUp, Upload } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const stats = [
    {
        name: 'Available Credits',
        value: '10,000',
        icon: CreditCard,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
        name: 'Files Processed',
        value: '12',
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
        name: 'Minutes Transcribed',
        value: '0',
        icon: Clock,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
        name: 'This Week',
        value: '8',
        icon: TrendingUp,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
];

const usageData = [
    { name: 'Mon', minutes: 12 },
    { name: 'Tue', minutes: 8 },
    { name: 'Wed', minutes: 15 },
    { name: 'Thu', minutes: 6 },
    { name: 'Fri', minutes: 20 },
    { name: 'Sat', minutes: 4 },
    { name: 'Sun', minutes: 10 },
];

const recentFiles = [
    { id: 1, name: 'Legal Deposition 001.mp3', duration: '45:32', status: 'Completed', date: '2 hours ago' },
    { id: 2, name: 'Client Interview.mp4', duration: '23:15', status: 'Processing', date: '4 hours ago' },
    { id: 3, name: 'Board Meeting 2024.mp3', duration: '1:12:45', status: 'Completed', date: '1 day ago' },
    { id: 4, name: 'Witness Statement.mp3', duration: '18:20', status: 'Completed', date: '2 days ago' },
];

function getGreetingWithLottie() {
    const hd = new Holidays('MY');
    const today = new Date();
    const holiday = hd.isHoliday(today);
    const hour = today.getHours();

    let greeting: string;
    let lottieUrl: string;

    // Define custom greetings and lottie URLs per holiday
    const holidayLottieMap: Record<string, { greeting: string; lottie: string }> = {
        Christmas: {
            greeting: 'Merry Christmas!',
            lottie: 'https://lottie.host/e2f6f91e-d844-4260-9c06-8d20a019d329/g0VGV85HYC.lottie',
        },
        'Chinese New Year': {
            greeting: 'Happy Chinese New Year!',
            lottie: 'https://lottie.host/02dd8e62-2702-48f3-a9f5-b5611efa666f/WybmrRr1e5.lottie',
        },
        'Hari Raya Aidilfitri': {
            greeting: 'Selamat Hari Raya Aidilfitri!',
            lottie: 'https://lottie.host/edeff43c-a264-464f-881a-2729d536c3a5/cINDwgbvHp.lottie',
        },
        'Hari Raya Haji': {
            greeting: 'Selamat Hari Raya Aidiladha!',
            lottie: 'https://lottie.host/71dc0322-106c-4314-91c9-48dcfbe7f08c/Ye0hLuVuZr.lottie',
        },
        Ramadan: {
            greeting: 'Selamat Menyambut Ramadan Mubarak!',
            lottie: 'https://lottie.host/a3c8c1c0-e0df-48ae-be7a-096f1138f925/zyzjmJ85eY.lottie',
        },
        Deepavali: {
            greeting: 'Happy Deepavali!',
            lottie: 'https://lottie.host/74d59009-3533-4f50-bc21-81111b9f748a/3vasntrlft.lottie',
        },
        'Hari Merdeka': {
            greeting: 'Selamat Hari Merdeka!',
            lottie: 'https://lottie.host/74e30750-7d2f-4741-822a-0c9163b20d81/1Jp8h6sjQg.lottie',
        },
        'Malaysia Day': {
            greeting: 'Selamat Hari Malaysia!',
            lottie: 'https://lottie.host/01491aa9-ce1f-4c17-91d0-1d9635a258f6/6D5O8xqjjQ.lottie',
        },
        'Labour Day': {
            greeting: 'Happy Labour Day!',
            lottie: 'https://lottie.host/a409d750-87b5-4491-9211-22c18bdb13fe/3GFWVTH0tU.lottie',
        },
    };

    if (Array.isArray(holiday) && holiday.length > 0) {
        const matched = holiday.find((h) => {
            return Object.keys(holidayLottieMap).some((key) => h.name?.toLowerCase().includes(key.toLowerCase()));
        });

        if (matched) {
            const key = Object.keys(holidayLottieMap).find((k) => matched.name.toLowerCase().includes(k.toLowerCase()));

            if (key) {
                greeting = holidayLottieMap[key].greeting;
                lottieUrl = holidayLottieMap[key].lottie;
                return { greeting, lottieUrl };
            }
        }
    }

    // If not a holiday, use time-based fallback
    if (hour >= 6 && hour <= 11) {
        greeting = 'Good morning';
        lottieUrl = 'https://lottie.host/8ab51fc6-1c5a-407b-a43b-229bc2e20116/DxigN1C62B.lottie';
    } else if (hour > 11 && hour <= 13) {
        greeting = 'Good afternoon';
        lottieUrl = 'https://assets10.lottiefiles.com/packages/lf20_i7ixqfgx.json';
    } else if (hour > 13 && hour <= 19) {
        greeting = 'Good evening';
        lottieUrl = 'https://lottie.host/58ac444b-806a-4daf-820b-fc55f13cc738/2wLpd7i3mx.lottie';
    } else {
        greeting = 'Good night';
        lottieUrl = 'https://lottie.host/f036e086-68c7-4ac1-99cc-f2f20bcb6e1a/TPAdDCow9o.lottie';
    }

    return { greeting, lottieUrl };
}

export default function Dashboard() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    // const getInitials = useInitials();
    const user = auth?.user || { name: 'User' };
    const { greeting, lottieUrl } = getGreetingWithLottie();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            {/* Default laravel template */}
            {/* <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div> */}

            <div className="mx-auto w-full p-6">
                <div className="mb-8 flex items-center gap-1">
                    {/* <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {getInitials(auth.user.name)}</h1> */}
                    {/* <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {auth.user.name}</h1> */}

                    <DotLottieReact src={lottieUrl} style={{ height: '90px', width: '90px' }} loop autoplay />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {greeting}, {user.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">Here's an overview of your transcription activity</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div className="flex items-center">
                                <div className={`${stat.bg} rounded-lg p-3`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.name}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Usage Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                    >
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Weekly Usage</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={usageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#F9FAFB',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="minutes"
                                    stroke="#7C3AED"
                                    strokeWidth={3}
                                    dot={{ fill: '#7C3AED', strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                    >
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href=""
                                className="group flex items-center justify-between rounded-lg bg-purple-50 p-4 transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30"
                            >
                                <div className="flex items-center">
                                    <Upload className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">Upload New File</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-purple-600 transition-transform group-hover:translate-x-1 dark:text-purple-400" />
                            </Link>
                            <Link
                                href=""
                                className="group flex items-center justify-between rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                            >
                                <div className="flex items-center">
                                    <FileText className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">View All Files</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1 dark:text-blue-400" />
                            </Link>
                            <Link
                                href=""
                                className="group flex items-center justify-between rounded-lg bg-green-50 p-4 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                            >
                                <div className="flex items-center">
                                    <CreditCard className="mr-3 h-5 w-5 text-green-600 dark:text-green-400" />
                                    <span className="font-medium text-gray-900 dark:text-white">Buy More Credits</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-green-600 transition-transform group-hover:translate-x-1 dark:text-green-400" />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Files */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Files</h3>
                            <Link
                                href=""
                                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                View all
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentFiles.map((file, index) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                                className="px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</h4>
                                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="mr-1 h-3 w-3" />
                                            <span>{file.duration}</span>
                                            <span className="mx-2">•</span>
                                            <span>{file.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                file.status === 'Completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            }`}
                                        >
                                            {file.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
