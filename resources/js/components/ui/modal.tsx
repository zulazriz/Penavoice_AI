import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export default function Modal({ isOpen, onClose, type, title, message }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {type === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className={`text-base font-semibold leading-6 ${
                type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-offset-2 sm:ml-3 sm:w-auto ${
                type === 'success'
                  ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                  : 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}