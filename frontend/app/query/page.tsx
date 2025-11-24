'use client';

import { useState, FormEvent } from 'react';
import api from '@/lib/api';
import type { QueryResult } from '@/types/query';

export default function QueryPage() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateForm = (): boolean => {
        if (!prompt.trim()) {
            setError('Please enter a query');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post<QueryResult>('/query', { prompt });
            setResult(res.data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } }; message?: string };
            setError(error.response?.data?.detail || error.message || 'Query failed');
            console.error('Query failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Natural Language Log Query</h2>

            <form onSubmit={handleSubmit} className="mb-6">
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Ask e.g. 'show me all anomalies for IP 10.0.0.5 last 24 hours'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    aria-label="Query prompt"
                />

                {error && (
                    <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                    {loading ? 'Running...' : 'Run Query'}
                </button>
            </form>

            {result && (
                <div className="bg-white border rounded-lg p-6 shadow text-gray-800">
                    <h3 className="font-semibold text-lg mb-3">Generated SQL</h3>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto mb-6">
                        {result.sql}
                    </pre>

                    <h3 className="font-semibold text-lg mb-3">
                        Results
                    </h3>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(result.rows, null, 2)}
                    </pre>
                    <h3 className="font-semibold text-lg mb-3">
                        AI Summary
                    </h3>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {result.response}
                    </pre>
                </div>
            )}
        </div>
    );
}
