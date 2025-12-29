"use client";
import React, { useState } from 'react';
import { X, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '../ui/button';

export function RequestReportModal({ isOpen, onClose, userInfo }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('message', message);
    
    // Get access token from localStorage and send it to the API
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      formData.append('accessToken', accessToken);
    }
    
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch('/api/send-report-request', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      
      alert('Request sent successfully!');
      onClose();
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error(error);
      alert('Error sending request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Request a Report
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* User Info Section */}
          {userInfo && (
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{userInfo.name || userInfo.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{userInfo.email || 'N/A'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your request
            </label>
            <textarea 
              className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-3 h-32 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please describe the report you need..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors relative group">
              <input 
                type="file" 
                multiple 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={e => setFiles(Array.from(e.target.files))}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Images, PDF, Excel (max 10MB)
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-zinc-800 p-2 rounded border border-gray-200 dark:border-zinc-700">
                    <span className="truncate max-w-[200px] text-gray-700 dark:text-gray-300">{f.name}</span>
                    <button 
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 dark:border-zinc-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
