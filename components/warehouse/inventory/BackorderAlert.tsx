import React from 'react';
import { BackorderItem } from './types';

interface BackorderAlertProps {
    backorderItems: BackorderItem[];
    totalBackorderQty: number;
    onRequestInventory: () => void;
}

export default function BackorderAlert({
    backorderItems,
    totalBackorderQty,
    onRequestInventory,
}: BackorderAlertProps) {
    if (backorderItems.length === 0) return null;

    return (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-800">Backorder Alert</h3>
                    <p className="text-sm text-orange-700 mt-1">
                        {backorderItems.length} product{backorderItems.length !== 1 ? 's' : ''} on backorder ({totalBackorderQty} total units) across {new Set(backorderItems.map(b => b.orderNumber)).size} order{new Set(backorderItems.map(b => b.orderNumber)).size !== 1 ? 's' : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {backorderItems.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                {item.partNumber}: {item.backorderQty} units ({item.orderNumber})
                            </span>
                        ))}
                        {backorderItems.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                +{backorderItems.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onRequestInventory}
                    className="flex-shrink-0 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                    Request Inventory
                </button>
            </div>
        </div>
    );
}
