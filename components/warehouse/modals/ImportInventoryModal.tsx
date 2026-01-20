import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { IMPORT_INVENTORY } from '@/app/graphql/warehouse';
import { toast } from 'sonner';

interface ImportInventoryModalProps {
    warehouseId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface ImportStats {
    processed: number;
    created: number;
    updated: number;
    errors: number;
    skipped: number;
}

export default function ImportInventoryModal({ warehouseId, onClose, onSuccess }: ImportInventoryModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [stats, setStats] = useState<ImportStats | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importInventory, { loading }] = useMutation<{ importInventory: ImportStats }>(IMPORT_INVENTORY);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStats(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            // Content is like "data:text/csv;base64,....." or just text depending on readAs method
            // We want base64 of the content.
            // If we use readAsDataURL, we get "data:application/vnd.ms-excel;base64,..."

            // Let's separate the base64 part.
            const base64Content = content.split(',')[1];

            try {
                const { data } = await importInventory({
                    variables: {
                        warehouseId,
                        file: base64Content,
                    },
                });

                if (data?.importInventory) {
                    setStats(data.importInventory);
                    toast.success('Inventory imported successfully');
                    onSuccess();
                }
            } catch (error: any) {
                toast.error('Import failed: ' + error.message);
            }
        };

        // Read as Data URL to get primitive Base64 encoding.
        // Note: CSV might be read as text/plain or application/vnd.ms-excel etc.
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Import Inventory</h2>
                    <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {!stats ? (
                    <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed border-[var(--border)] rounded-lg text-center hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-2">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <div className="text-sm font-medium">
                                    {file ? file.name : 'Click to select CSV file'}
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)]">
                                    Supports .csv files
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium hover:bg-[var(--muted)] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                Import
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[var(--muted)] rounded-lg">
                                <div className="text-sm text-[var(--muted-foreground)]">Processed</div>
                                <div className="text-2xl font-bold">{stats.processed}</div>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <div className="text-sm text-green-600 dark:text-green-400">Updated</div>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.updated}</div>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-sm text-blue-600 dark:text-blue-400">Created</div>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.created}</div>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.errors}</div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
