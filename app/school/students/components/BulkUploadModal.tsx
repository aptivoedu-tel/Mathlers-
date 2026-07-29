'use client';

import { useState, useRef } from 'react';
import { X, Upload, Download, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface BulkUploadModalProps {
  domain: string;
  uploadType: 'students' | 'teachers';
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ domain, uploadType, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ message?: string; details?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isStudents = uploadType === 'students';

  const handleDownloadTemplate = () => {
    // Dynamically import xlsx on client
    import('xlsx').then((XLSX) => {
      const headers = isStudents
        ? [['Name', 'Username', 'Roll Number', 'Password']]
        : [['Name', 'Username', 'Subject', 'Password']];

      const ws = XLSX.utils.aoa_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isStudents ? 'Students' : 'Teachers');

      // Set column widths
      ws['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 18 }];

      XLSX.writeFile(wb, isStudents ? 'student_template.xlsx' : 'teacher_template.xlsx');
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Skip header row
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

      if (dataRows.length === 0) {
        throw new Error('The uploaded file contains no data rows.');
      }

      const items = dataRows.map((row) => {
        if (isStudents) {
          return {
            name: String(row[0] || '').trim(),
            username: String(row[1] || '').trim().toLowerCase(),
            rollNumber: String(row[2] || '').trim(),
            password: String(row[3] || '').trim(),
          };
        } else {
          return {
            name: String(row[0] || '').trim(),
            username: String(row[1] || '').trim().toLowerCase(),
            subject: String(row[2] || '').trim(),
            password: String(row[3] || '').trim(),
          };
        }
      });

      const endpoint = isStudents ? '/api/school/students' : '/api/school/teachers';
      const bodyKey = isStudents ? 'students' : 'teachers';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: items }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && data.details.length > 0) {
          setError(data.details.join('\n'));
        } else {
          throw new Error(data.error || 'Upload failed.');
        }
        return;
      }

      setResult({ message: data.message, details: data.details });

      if (!data.details || data.details.length === 0) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in outline-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Bulk Upload {isStudents ? 'Students' : 'Teachers'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800 text-sm space-y-1">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Download the Excel template below.</li>
              <li>Fill in the {isStudents ? 'student' : 'teacher'} details (one per row).</li>
              <li>Upload the completed file.</li>
              <li>Emails will be auto-generated as <code>username.{domain}@mathlers.com</code>.</li>
            </ol>
          </div>

          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Download Template (.xlsx)
          </button>

          {/* File Input */}
          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-brand-primary hover:bg-brand-lighter/10 transition-all"
          >
            <FileSpreadsheet className="w-10 h-10 text-gray-300" />
            {file ? (
              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to select an Excel file (.xlsx)</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Result */}
          {result && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
              <p className="font-bold">{result.message}</p>
              {result.details && result.details.length > 0 && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Some rows had issues:</p>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {result.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 whitespace-pre-line">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!file || isUploading}
            onClick={handleUpload}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload &amp; Create</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
