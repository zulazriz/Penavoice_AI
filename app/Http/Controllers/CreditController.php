<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User; // Ensure User model is correctly imported
use Illuminate\Support\Facades\Log;

class CreditController extends Controller
{
    /**
     * Get the authenticated user's credits.
     * This method is generally safe as it's a read operation.
     */
    public function getCredits(Request $request)
    {
        $user = $request->user();

        // Ensure a user is authenticated before proceeding
        if (!$user) {
            Log::warning("[CREDITS] Unauthorized attempt to get credits");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        Log::info("[CREDITS] Fetching credits for user:\n" . json_encode([
            'user_id' => $user->id,
            'credits' => $user->credits,
        ], JSON_PRETTY_PRINT));

        return response()->json(['credits' => $user->credits]);
    }

    /**
     * Deduct credits from the authenticated user with atomic update.
     */
    public function deductCredits(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'fileName' => 'nullable|string',
            'duration' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        Log::info("validated\n" . json_encode([
            $validated
        ], JSON_PRETTY_PRINT));

        $amount = $validated['amount']; // Get the validated amount

        // Get the authenticated user. We'll re-fetch this inside the transaction for locking.
        $user = Auth::user();

        // Safety check: Ensure a user is actually authenticated
        if (!$user) {
            Log::warning("[CREDITS] Unauthorized attempt to deduct credits (no user found)");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Log the initial request details
        Log::info("[CREDITS] Deduction request received:\n" . json_encode([
            'user_id' => $user->id,
            'requested_deduction' => $amount,
            'file' => $validated['fileName'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'description' => $validated['description'] ?? null,
            'current_credits_at_request_time' => $user->credits, // Log credits before the transaction starts
        ], JSON_PRETTY_PRINT));

        try {
            DB::transaction(function () use ($user, $amount) {
                // Re-fetch the user within the transaction using 'lockForUpdate()'.
                // Using where()->first() after lockForUpdate() ensures $lockedUser is always a model instance.
                $lockedUser = User::where('id', $user->id)->lockForUpdate()->first();

                // If for some reason the user is not found during the locked fetch (highly unlikely if Auth::user() worked)
                if (!$lockedUser) {
                    throw new \Exception("User not found during locked credit deduction.");
                }

                // Perform the credit check using the locked user's current credits
                if ($lockedUser->credits < $amount) {
                    Log::warning("[CREDITS] Insufficient credits for user {$lockedUser->id}. Available: {$lockedUser->credits}, Requested: {$amount}");
                    // Throw an exception to rollback the transaction if credits are insufficient
                    throw new \Exception('Insufficient credits');
                }

                // Deduct credits and save the updated user model
                $lockedUser->credits -= $amount;
                $lockedUser->save();

                // Update the credits of the original $user object for the response
                // This ensures the response reflects the truly updated value after the transaction.
                $user->credits = $lockedUser->credits;
            });

            // Log successful deduction after the transaction commits
            Log::info("[CREDITS] Credits deducted successfully for user {$user->id}. New balance: {$user->credits}");

            // Return success response with the new credit balance
            return response()->json([
                'message' => 'Credits deducted successfully',
                'newCredits' => $user->credits,
            ]);
        } catch (\Exception $e) {
            // Handle specific exception for insufficient credits
            if ($e->getMessage() === 'Insufficient credits') {
                return response()->json(['message' => 'Insufficient credits'], 400);
            }
            // Log any other unexpected errors during the transaction
            Log::error("[CREDITS] Error deducting credits for user {$user->id}: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred during credit deduction'], 500);
        }
    }

    /**
     * Add credits to the authenticated user with atomic update.
     */
    public function addCredits(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $amount = $validated['amount']; // Get the validated amount

        // Get the authenticated user. We'll re-fetch this inside the transaction for locking.
        $user = Auth::user();

        // Safety check: Ensure a user is actually authenticated
        if (!$user) {
            Log::warning("[CREDITS] Unauthorized attempt to add credits (no user found)");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Log the initial request details
        Log::info("[CREDITS] Add credits request:\n" . json_encode([
            'user_id' => $user->id,
            'amount_to_add' => $amount,
            'description' => $validated['description'] ?? null,
            'current_credits_at_request_time' => $user->credits, // Log credits before the transaction starts
        ], JSON_PRETTY_PRINT));

        try {
            DB::transaction(function () use ($user, $amount) {
                // Re-fetch the user within the transaction using 'lockForUpdate()'.
                // Using where()->first() after lockForUpdate() ensures $lockedUser is always a model instance.
                $lockedUser = User::where('id', $user->id)->lockForUpdate()->first();

                // If for some reason the user is not found during the locked fetch
                if (!$lockedUser) {
                    throw new \Exception("User not found during locked credit addition.");
                }

                // Add credits and save the updated user model
                $lockedUser->credits += $amount;
                $lockedUser->save();

                // Update the credits of the original $user object for the response
                $user->credits = $lockedUser->credits;
            });

            // Log successful addition after the transaction commits
            Log::info("[CREDITS] Credits added successfully for user {$user->id}. New balance: {$user->credits}");

            // Return success response with the new credit balance
            return response()->json([
                'message' => 'Credits added successfully',
                'newCredits' => $user->credits,
            ]);
        } catch (\Exception $e) {
            // Log any unexpected errors during the transaction
            Log::error("[CREDITS] Error adding credits for user {$user->id}: " . $e->getMessage());
            return response()->json(['message' => 'An error occurred during credit addition'], 500);
        }
    }
}
