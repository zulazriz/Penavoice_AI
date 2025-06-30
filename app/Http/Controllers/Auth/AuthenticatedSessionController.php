<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();

        // Create Sanctum token
        $token = $user->createToken('tokenpenavoice')->plainTextToken;

        // Store token in session (so frontend can use it)
        session(['auth_token' => $token]);

        Log::info("User Logged In:\n" . json_encode([
            'user_id' => $user->id,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'credits' => $user->credits,
            'sanctum_token' => $token,
        ], JSON_PRETTY_PRINT));

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Revoke all API tokens for the user (if any exist)
        if ($request->user()) {
            Log::info("User Logged Out:\n" . json_encode([
                'user_id' => $request->user()->id,
                'email' => $request->user()->email,
                'role' => $request->user()->role->role_name,
            ], JSON_PRETTY_PRINT));


            $request->user()->tokens()->delete(); // delete all tokens
        }

        // Log out from web guard
        Auth::guard('web')->logout();

        // Invalidate the session and regenerate CSRF token
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
