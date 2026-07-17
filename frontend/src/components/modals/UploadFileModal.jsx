import { useRef, useState } from 'react';
import Modal from '../Modal';
import { api, ApiError } from '../../api/client';
import { UploadCloud, FileUp } from 'lucide-react';

export default function UploadFileModal({ channelName, channelToken, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    if (fileList?.[0]) {
      setFile(fileList[0]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { blob_name, upload_url } = await api.requestUpload(channelName, channelToken, file.name);
      await api.uploadToBlob(upload_url, file);
      await api.completeUpload(channelName, channelToken, blob_name, file.name);
      onUploaded();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Upload failed. Please try again.');
      }
      setUploading(false);
    }
  };

  return (
    <Modal title="Upload a file" onClose={uploading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploading) handleFiles(e.dataTransfer.files);
          }}
          role="button"
          tabIndex={0}
          className={`rounded-xl border-2 border-dashed px-6 py-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-signal bg-signal/5' : 'border-hair hover:border-signal/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {file ? (
            <>
              <FileUp size={26} className="text-teal" />
              <div>
                <p className="font-medium text-paper">{file.name}</p>
                <p className="text-xs font-mono text-mist mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </>
          ) : (
            <>
              <UploadCloud size={26} className="text-mist" />
              <p className="text-sm text-mist">
                <span className="text-signal font-medium">Choose a file</span> or drag it here
              </p>
            </>
          )}
        </div>

        {uploading && (
          <div className="flex items-center gap-3 text-sm text-mist">
            <span className="w-4 h-4 rounded-full border-2 border-hair border-t-signal animate-spin shrink-0" />
            Uploading to {channelName}…
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="rounded-lg bg-signal text-ink font-medium py-2.5 hover:bg-signal-soft transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
      </form>
    </Modal>
  );
}
