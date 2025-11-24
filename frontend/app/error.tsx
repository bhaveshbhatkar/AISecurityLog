'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Something went wrong!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        An unexpected error occurred. Please try again.
                    </p>
                    {error.message && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
                            <p className="text-sm text-red-800 font-mono">{error.message}</p>
                        </div>
                    )}
                    <button
                        onClick={reset}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
