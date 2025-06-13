import { useCallback, useState } from 'react';
import { ModalState } from '../types';

export const useModal = () => {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
    });

    const showModal = useCallback(
        (
            type: ModalState['type'],
            title: string,
            message: string,
            options?: {
                confirmText?: string;
                cancelText?: string;
                onConfirm?: () => void;
                showCancel?: boolean;
            },
        ) => {
            setModal({
                isOpen: true,
                type,
                title,
                message,
                confirmText: options?.confirmText || 'OK',
                cancelText: options?.cancelText || 'Cancel',
                onConfirm: options?.onConfirm,
                showCancel: options?.showCancel || false,
            });
        },
        [],
    );

    const showSuccess = useCallback(
        (title: string, message: string, onConfirm?: () => void) => {
            showModal('success', title, message, { onConfirm });
        },
        [showModal],
    );

    const showError = useCallback(
        (title: string, message: string, onConfirm?: () => void) => {
            showModal('error', title, message, { onConfirm });
        },
        [showModal],
    );

    const showWarning = useCallback(
        (title: string, message: string, onConfirm?: () => void) => {
            showModal('warning', title, message, { onConfirm });
        },
        [showModal],
    );

    const showConfirm = useCallback(
        (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string }) => {
            showModal('confirm', title, message, {
                ...options,
                onConfirm,
                showCancel: true,
            });
        },
        [showModal],
    );

    const hideModal = useCallback(() => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        modal,
        showModal,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
        hideModal,
    };
};
