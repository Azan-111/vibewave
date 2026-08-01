import React, { useState, useEffect } from 'react';
import { HardDrive, X, CheckCircle2, AlertTriangle, ShieldCheck, Download, ExternalLink, Loader2, FileCode, FolderCheck } from 'lucide-react';
import { CodeFile, requestGoogleDriveToken, pushFilesToDrive, filterNecessaryFiles, DriveExportResult } from '../lib/driveSync';

interface GoogleDriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveExportModal: React.FC<GoogleDriveExportModalProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DriveExportResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingFiles(true);
      setError(null);
      setResult(null);
      setProgress({ current: 0, total: 0 });
      setStatusMessage('');

      fetch('/api/project-files')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load project files');
          return res.json();
        })
        .then((data) => {
          const filtered = filterNecessaryFiles(data.files || []);
          setFiles(filtered);
          setLoadingFiles(false);
        })
        .catch((err) => {
          setError(err.message || 'Error fetching file structure');
          setLoadingFiles(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDriveExport = async () => {
    setError(null);
    setExporting(true);
    setStatusMessage('Requesting Google Drive permission...');

    try {
      // 1. Prompt user for Google Drive OAuth token
      const token = await requestGoogleDriveToken();

      // 2. Push files into user's Google Drive
      const exportResult = await pushFilesToDrive(token, files, (msg, current, total) => {
        setStatusMessage(msg);
        setProgress({ current, total });
      });

      setResult(exportResult);
      setStatusMessage('Export completed successfully!');
    } catch (err: any) {
      console.error('Drive export error:', err);
      setError(err.message || 'An error occurred while pushing files to Google Drive');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-xs">
              <HardDrive className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Push Codebase to Google Drive
              </h3>
              <p className="text-xs text-slate-300">
                Backup source files directly to your personal Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Security Notice Pill */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong className="font-semibold block text-emerald-950 mb-0.5">
                Environment & Secret Protection Enabled
              </strong>
              All <code className="bg-emerald-100/80 text-emerald-800 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> files, API keys, build outputs, and local databases are strictly excluded before pushing. Only clean, necessary application source code will be saved.
            </div>
          </div>

          {/* Success Result View */}
          {result ? (
            <div className="p-5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-4 text-slate-800">
              <div className="flex items-center gap-3 text-indigo-900">
                <CheckCircle2 className="w-7 h-7 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-indigo-950">
                    Successfully Pushed to Google Drive!
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Uploaded {result.fileCount} source files + ready-to-use codebase archive.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={result.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-md text-xs font-semibold text-indigo-700 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-indigo-600" />
                    <span>Open Drive Folder</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" />
                </a>

                {result.zipUrl && (
                  <a
                    href={result.zipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-md text-xs font-semibold text-indigo-700 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>View ZIP Archive</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* File List Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    Files to Push ({loadingFiles ? '...' : files.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Strictly code &amp; assets only
                  </span>
                </div>

                {loadingFiles ? (
                  <div className="h-32 flex items-center justify-center border border-slate-200 rounded-xl bg-slate-50">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2.5 space-y-1">
                    {files.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between px-2.5 py-1 rounded-md text-xs font-mono text-slate-700 bg-white border border-slate-100 hover:border-slate-300"
                      >
                        <span className="truncate">{file.path}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {(file.content.length / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Progress Bar */}
              {exporting && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      {statusMessage}
                    </span>
                    {progress.total > 0 && (
                      <span className="font-mono text-slate-500">
                        {progress.current} / {progress.total}
                      </span>
                    )}
                  </div>
                  {progress.total > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-rose-900">Export Error</strong>
                    {error}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {!result && (
            <button
              id="confirm-push-drive-btn"
              onClick={handleStartDriveExport}
              disabled={exporting || loadingFiles || files.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pushing to Drive...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Connect &amp; Push to Google Drive</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
