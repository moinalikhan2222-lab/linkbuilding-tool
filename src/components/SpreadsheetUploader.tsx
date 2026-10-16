import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { CampaignDefaults } from '../types/index.ts';

interface SpreadsheetUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  defaults: CampaignDefaults;
  onUpdateDefaults: (defaults: Partial<CampaignDefaults>) => void;
}

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  defaults,
  onUpdateDefaults,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState(defaults.defaultTargetUrl || 'https://example.com');
  const [anchorText, setAnchorText] = useState(defaults.defaultAnchorText || 'Authority Platform');
  
  // Custom mapping state
  const [showMapping, setShowMapping] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setError('Please upload a valid .xlsx, .xls, or .csv file');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);

    // Initial dry-upload to detect columns and analyze
    setIsUploading(true);
    try {
      // Save updated defaults
      await onUpdateDefaults({ defaultTargetUrl: targetUrl, defaultAnchorText: anchorText });
      const res = await api.uploadSpreadsheet(selectedFile);
      setUploadResult(res);
      setDetectedHeaders(res.detectedHeaders || []);
      setColumnMapping(res.mapping || {});
      if (res.warnings && res.warnings.length > 0) {
        setShowMapping(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse spreadsheet');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCustomMapping = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await onUpdateDefaults({ defaultTargetUrl: targetUrl, defaultAnchorText: anchorText });
      const res = await api.uploadSpreadsheet(file, columnMapping);
      setUploadResult(res);
      setShowMapping(false);
    } catch (err: any) {
      setError(err.message || 'Mapping error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmAndStart = () => {
    onUploadSuccess();
    onClose();
  };

  const standardFields = [
    { key: 'websiteUrl', label: 'Website URL (Required)', required: true },
    { key: 'registrationUrl', label: 'Registration URL' },
    { key: 'loginUrl', label: 'Login URL' },
    { key: 'targetUrl', label: 'Target URL (My Website)' },
    { key: 'anchorText', label: 'Anchor Text' },
    { key: 'preferredBacklinkType', label: 'Preferred Backlink Type' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password' },
    { key: 'websiteName', label: 'Website Name' },
    { key: 'additionalInstructions', label: 'Additional Instructions' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-zinc-950/80">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Import Link Building Spreadsheet
              </h2>
              <p className="text-xs text-zinc-400">
                Excel (.xlsx, .xls) or CSV with target link prospects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Defaults section if essential info missing in sheet */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Default Campaign Fallbacks (Used if spreadsheet row is blank)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Default Target URL (Your Website) *
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://mysite.com/article"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Default Anchor Text *
                </label>
                <input
                  type="text"
                  value={anchorText}
                  onChange={e => setAnchorText(e.target.value)}
                  placeholder="Best AI Tools"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 text-center bg-zinc-950/40 hover:bg-zinc-950/70 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-200">
              {file ? file.name : 'Click to select or drag & drop spreadsheet file'}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Supports .xlsx, .xls, and .csv with auto-column header detection
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Success & Analysis */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Spreadsheet Analyzed Successfully</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-200">
                    {uploadResult.rowsCount} eligible rows
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 flex flex-wrap gap-4 pt-1">
                  <span>Duplicates Avoided: {uploadResult.duplicatesFound}</span>
                  <span>Preserved Original Row Numbers: Yes</span>
                  <span>Background Pipeline Ready: Yes</span>
                </div>
              </div>

              {/* Column Mapping Review Button */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  Headers detected: {detectedHeaders.length} columns
                </span>
                <button
                  type="button"
                  onClick={() => setShowMapping(!showMapping)}
                  className="text-zinc-300 hover:text-white underline font-medium cursor-pointer"
                >
                  {showMapping ? 'Hide Column Mapping' : 'Review / Customize Column Mapping'}
                </button>
              </div>

              {/* Column Mapping Section */}
              {showMapping && (
                <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                  <div className="text-xs font-semibold text-zinc-200">
                    Map Spreadsheet Columns to Agent Fields
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {standardFields.map(f => (
                      <div key={f.key} className="text-xs">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">
                          {f.label}
                        </label>
                        <select
                          value={columnMapping[f.key] || ''}
                          onChange={e =>
                            setColumnMapping({ ...columnMapping, [f.key]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
                        >
                          <option value="">-- Ignore / Not in file --</option>
                          {detectedHeaders.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyCustomMapping}
                    disabled={isUploading}
                    className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-colors cursor-pointer"
                  >
                    Apply Column Mapping
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAndStart}
            disabled={!uploadResult || uploadResult.rowsCount === 0 || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Confirm & Load Campaign</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
