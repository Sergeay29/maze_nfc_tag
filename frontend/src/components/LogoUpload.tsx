import React, { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface LogoUploadProps {
  value: string;                    // URL actuelle (logo déjà enregistré)
  onChange: (url: string) => void;  // URL (reset ou existante)
  onFileSelect?: (file: File | null) => void; // Fichier sélectionné, à uploader au submit
  label?: string;
  previewName?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  value,
  onChange,
  onFileSelect,
  label = 'Logo',
  previewName = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nettoyer l'object URL pour éviter les fuites mémoire
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setError('Fichier trop lourd (max 2 MB)');
      return;
    }
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    onFileSelect?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onChange('');
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displaySrc = preview || value || null;
  const initials = previewName
    ? previewName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark mb-2 font-inter">
          {label}
        </label>
      )}

      <div
        className="flex items-center gap-4 p-3 border-2 border-dashed rounded-xl transition-colors duration-200 border-slate/20 hover:border-primary/40 bg-cloud"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Aperçu */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient">
          {displaySrc ? (
            <img src={displaySrc} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg font-poppins">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark">
            {preview ? 'Image sélectionnée' : value ? 'Logo actuel' : 'Glissez une image ou cliquez'}
          </p>
          <p className="text-xs text-slate mt-0.5">JPG, PNG, WEBP — max 2 MB</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {displaySrc && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate hover:text-red-500 transition-colors"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choisir
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
};

export default LogoUpload;
