'use client';

import { useState, FormEvent } from 'react';
import api from '@/lib/api';
import type { UploadResponse } from '@/types/upload';

export default function FileUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const validateFile = (): boolean => {
        if (!file) {
            setError('Please select a file');
            return false;
        }

        // Optional: Add file type validation
        const allowedTypes = ['.log', '.txt', '.json'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!allowedTypes.some(type => fileExtension === type)) {
            setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
            return false;
        }

        // Optional: Add file size validation (e.g., max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            setError('File size must be less than 50MB');
            return false;
        }

        setError('');
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMsg('');
        setError('');

        if (!validateFile()) {
            return;
        }

        const fd = new FormData();
        fd.append('file', file!);

        setIsUploading(true);

        try {
            const res = await api.post<UploadResponse>('/uploads', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMsg(`Upload queued: ${res.data.uploadId}`);
            setFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } }; message?: string };
            setError(error.response?.data?.detail || error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
            <h3 className="text-xl font-semibold text-gray-500 mb-4">Upload Log File</h3>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <input
                        id="file-input"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept=".log,.txt,.json"
                        aria-label="Select log file"
                    />
                    {file && (
                        <p className="text-sm text-gray-600 mt-2">
                            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                {msg && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-green-800 text-sm">{msg}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
        </div>
    );
}
