import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_id: string;
};

interface Props {
    roles: { id: number; role_name: string }[];
}

export default function Register({ roles }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Field */}
                    <div className="relative grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="Password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirm Password Field */}
                    <div className="relative grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="Confirm password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500 hover:text-gray-700"
                            >
                                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="grid w-60 gap-2">
                        <Label htmlFor="roles">Roles</Label>
                        <select
                            id="roles"
                            required
                            tabIndex={2}
                            value={data.role_id}
                            onChange={(e) => setData('role_id', e.target.value)}
                            disabled={processing}
                            className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="" disabled selected>
                                Choose
                            </option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.role_name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.role_id} />
                    </div>

                    <div className="mt-4 flex w-full gap-2">
                        <Button
                            type="button"
                            className="group relative flex w-1/3 justify-center rounded-lg border border-transparent bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            tabIndex={3}
                            onClick={() => (window.location.href = '/login')}
                        >
                            Back
                        </Button>

                        <Button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            tabIndex={5}
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {processing ? 'Creating...' : 'Create account'}
                        </Button>
                    </div>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')} className="text-blue-600 hover:text-blue-800" tabIndex={6}>
                        Sign in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
