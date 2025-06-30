import type { SharedData } from '@/types'; // Import SharedData for type safety
import { router, usePage } from '@inertiajs/react'; // Corrected import: use 'router' instead of 'Inertia'
import axios from 'axios'; // Import axios for API calls
import { createContext, ReactNode, useContext, useState } from 'react';

interface CreditContextType {
    deductCredits: (amount: number, fileName: string, duration: number, processingDays?: number) => Promise<boolean>;
    addCredits: (amount: number) => Promise<boolean>;
    calculateCreditsForDuration: (durationInSeconds: number) => number;
    getTransactionHistory: () => CreditTransaction[]; // Still for local display if you want. Backend would be better.
    isLoadingCredits: boolean; // Add a loading state
}

interface CreditTransaction {
    id: string;
    type: 'deduction' | 'addition';
    amount: number;
    fileName?: string;
    duration?: number;
    processingDays?: number; // Add processing days to transaction history
    timestamp: Date; // Note: This is a Date object
    description: string;
}

// NEW INTERFACE for data retrieved from localStorage
interface StoredCreditTransaction {
    id: string;
    type: 'deduction' | 'addition';
    amount: number;
    fileName?: string;
    duration?: number;
    processingDays?: number;
    timestamp: string; // Note: This is a string when stored in localStorage
    description: string;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
    children: ReactNode;
}

export function CreditProvider({ children }: CreditProviderProps) {
    // const page = usePage<SharedData>();
    // const { auth } = page.props;
    const CREDIT_API = '/customer/credits';
    let deductionInProgress = false;

    const [isLoadingCredits, setIsLoadingCredits] = useState(false); // New loading state

    const [transactions, setTransactions] = useState<CreditTransaction[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('creditTransactions');
                if (stored) {
                    // Use the new StoredCreditTransaction interface here
                    const parsed: StoredCreditTransaction[] = JSON.parse(stored);
                    return parsed.map((transaction: StoredCreditTransaction) => ({
                        // Specify type for 'transaction' in map
                        ...transaction,
                        timestamp: new Date(transaction.timestamp), // Convert string back to Date object
                    }));
                }
            } catch (error) {
                console.error('Error loading transaction history from localStorage:', error);
            }
        }
        return [];
    });

    /**
     * Calculate base credits required for media duration (for display only)
     * This shows minutes for user reference, NOT used for actual deduction
     */
    const calculateCreditsForDuration = (durationInSeconds: number): number => {
        // Round up to nearest minute for display
        return Math.ceil(durationInSeconds / 60);
    };

    /**
     * Deduct credits from user account
     * This function uses the EXACT credit amount calculated based on processing duration
     *
     * @param amount - EXACT credits to deduct (already calculated with pricing)
     * @param fileName - Name of the file being processed
     * @param duration - Duration of the file in seconds
     * @param processingDays - Processing duration selected (for logging/tracking)
     */
    const deductCredits = async (amount: number, fileName: string, duration: number, processingDays: number = 21): Promise<boolean> => {
        if (deductionInProgress) {
            console.warn('[DEDUCT CREDITS] Duplicate attempt prevented');
            return false;
        }

        deductionInProgress = true;
        setIsLoadingCredits(true);

        const roundedDuration = Math.round(duration);
        const creditsToDeduct = Math.round(amount);

        const payload = {
            amount: creditsToDeduct,
            fileName,
            duration: roundedDuration,
            processingDays,
            description: `Transcription processing for ${fileName} (${Math.ceil(duration / 60)} minutes, ${processingDays} days processing)`,
        };

        console.log('[DEDUCT CREDITS] Sending payload:', payload);

        try {
            const response = await axios.post(`${CREDIT_API}/deductCredits`, payload);

            if (response.data.newCredits !== undefined) {
                const newTransaction: CreditTransaction = {
                    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'deduction',
                    amount: creditsToDeduct,
                    fileName,
                    duration: roundedDuration,
                    processingDays,
                    timestamp: new Date(),
                    description: payload.description,
                };
                setTransactions((prev) => [newTransaction, ...prev.slice(0, 99)]);

                console.log(`✅ Credits deducted: ${creditsToDeduct}. New balance: ${response.data.newCredits}`);

                // OPTIONAL: Only reload after a delay to avoid race
                setTimeout(() => {
                    router.reload({ only: ['auth'] });
                }, 500);
            }

            return true;
        } catch (error: unknown) {
            console.error('❌ Error deducting credits:', error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                alert(`Error deducting credits: ${error.response.data.message}`);
            } else if (error instanceof Error) {
                alert(`Failed to deduct credits. Error: ${error.message}`);
            } else {
                alert('Failed to deduct credits. Unknown error.');
            }
            return false;
        } finally {
            deductionInProgress = false;
            setIsLoadingCredits(false);
        }
    };

    /**
     * Add credits to user account
     */
    const addCredits = async (amount: number): Promise<boolean> => {
        setIsLoadingCredits(true);
        try {
            const response = await axios.post(`${CREDIT_API}/addCredits`, {
                amount,
                description: `Credits added to account`,
            });

            if (response.data.newCredits !== undefined) {
                router.reload({
                    only: ['auth'],
                    onSuccess: () => {
                        const newTransaction: CreditTransaction = {
                            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'addition',
                            amount,
                            timestamp: new Date(),
                            description: `Credits added to account`,
                        };
                        setTransactions((prev) => [newTransaction, ...prev.slice(0, 99)]);
                        console.log(`Credits added: ${amount}. New total: ${response.data.newCredits}`);
                    },
                });
            }
            return true;
        } catch (error: unknown) {
            // Use 'unknown' for better type safety
            console.error('Error adding credits:', error);
            // Type guard for AxiosError
            if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
                alert(`Error adding credits: ${error.response.data.message}`);
            } else if (error instanceof Error) {
                alert(`Failed to add credits. Error: ${error.message}`);
            } else {
                alert('Failed to add credits. An unknown error occurred.');
            }
            return false;
        } finally {
            setIsLoadingCredits(false);
        }
    };

    const getTransactionHistory = () => transactions;

    return (
        <CreditContext.Provider
            value={{
                deductCredits,
                addCredits,
                calculateCreditsForDuration,
                getTransactionHistory,
                isLoadingCredits,
            }}
        >
            {children}
        </CreditContext.Provider>
    );
}

export function useCredits() {
    const context = useContext(CreditContext);
    if (context === undefined) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    const page = usePage<SharedData>();
    const { auth } = page.props;

    return { ...context, credits: auth.user.credits };
}
