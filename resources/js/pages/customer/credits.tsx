import { CategoryHeader } from '@/components/ui/category-header';
import { PackageCard } from '@/components/ui/package-card';
import { creditPackages } from '@/data/creditPackages';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Building, Building2, Factory, User } from 'lucide-react';
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Credits',
        href: '/customer/credits',
    },
];

const iconMap = {
    User,
    Building2,
    Building,
    Factory,
};

export default function Credits() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const handlePurchase = (packageId: string) => {
        // In a real application, this would integrate with your payment system
        console.log('Purchasing package:', packageId);
        alert(`Redirecting to payment for package: ${packageId}`);
    };

    const filteredPackages = selectedCategory === 'all' ? creditPackages : creditPackages.filter((category) => category.id === selectedCategory);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Credit Packages" />

            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mt-10 mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Choose Your Credit Package</h1>
                    <p className="max-w-2l text-l mx-auto text-gray-600 dark:text-white">
                        Select the perfect credit package for your needs. All prices are in Malaysian Ringgit (MYR) and include bonus credits for
                        better value.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="mb-12 flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
                            selectedCategory === 'all' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All Categories
                    </button>
                    {creditPackages.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
                                selectedCategory === category.id ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Package Categories */}
                <div className="space-y-16">
                    {filteredPackages.map((category) => {
                        const IconComponent = iconMap[category.icon as keyof typeof iconMap];

                        return (
                            <section key={category.id} className="scroll-mt-8" id={category.id}>
                                <CategoryHeader
                                    title={category.title}
                                    description={category.description}
                                    targetAudience={category.targetAudience}
                                    icon={IconComponent}
                                    color={category.color}
                                />

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {category.packages.map((pkg) => (
                                        <PackageCard key={pkg.id} package={pkg} categoryColor={category.color} onPurchase={handlePurchase} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Footer Information */}
                <div className="mt-16 mb-10 rounded-xl bg-gray-50 p-8">
                    <div className="mb-6 text-center">
                        <h3 className="mb-4 text-2xl font-bold text-gray-900">Need Help Choosing?</h3>
                        <p className="mx-auto max-w-2xl text-gray-600">
                            Our credit packages are designed to provide maximum value for different user types. All packages include bonus credits and
                            extended validity periods.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-white p-4">
                            <h4 className="mb-2 font-semibold text-gray-900">Secure Payments</h4>
                            <p className="text-sm text-gray-600">All transactions are encrypted and secure</p>
                        </div>
                        <div className="rounded-lg bg-white p-4">
                            <h4 className="mb-2 font-semibold text-gray-900">Instant Activation</h4>
                            <p className="text-sm text-gray-600">Credits are added immediately after payment</p>
                        </div>
                        <div className="rounded-lg bg-white p-4">
                            <h4 className="mb-2 font-semibold text-gray-900">24/7 Support</h4>
                            <p className="text-sm text-gray-600">Get help whenever you need it</p>
                        </div>
                        <div className="rounded-lg bg-white p-4">
                            <h4 className="mb-2 font-semibold text-gray-900">No Expiry</h4>
                            <p className="text-sm text-gray-600">Credits never expire once purchased</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
