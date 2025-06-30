<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        $roles = Roles::all();

        // Log::debug("ROLES: " . json_encode($roles, JSON_PRETTY_PRINT));

        return Inertia::render('auth/register', [
            'roles' => $roles,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Log::debug("Req: " . json_encode($request->all(), JSON_PRETTY_PRINT));

        $creditsAmount = 100; //Default credit amount for new user.

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'required',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'credits' => $creditsAmount,
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Create Sanctum token
        $token = $user->createToken('tokenpenavoice')->plainTextToken;

        // Store token in session (so it can be accessed in frontend after redirect)
        session(['auth_token' => $token]);

        Log::info("User Registered:\n" . json_encode([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'credits' => $user->credits,
            'sanctum_token' => $token,
        ], JSON_PRETTY_PRINT));

        return to_route('dashboard');
    }
}
