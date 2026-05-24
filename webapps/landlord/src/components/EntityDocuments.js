import { downloadDocument, uploadDocument } from '../utils/fetch';
import { LuDownload, LuTrash2, LuUpload } from 'react-icons/lu';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Generic file attachments for an entity (proprietaire, lot…). Files are
// uploaded through the existing /documents/upload endpoint (MinIO when the
// realm has S3 configured, local filesystem otherwise) and their storage keys
// are kept in the entity's `documents` array. `onChange` persists the new list.
export default function EntityDocuments({ documents = [], onChange, folder }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const response = await uploadDocument({
        endpoint: '/documents/upload',
        documentName: file.name,
        file,
        folder
      });
      onChange([...(documents || []), response.data.key]);
      toast.success('Document téléversé');
    } catch (error) {
      toast.error('Échec du téléversement');
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const handleDownload = async (key) => {
    try {
      await downloadDocument({
        endpoint: `/documents/download?url=${encodeURIComponent(key)}`,
        documentName: key.split('/').pop()
      });
    } catch (error) {
      toast.error('Échec du téléchargement');
    }
  };

  const handleRemove = (key) =>
    onChange((documents || []).filter((doc) => doc !== key));

  return (
    <div className="grid gap-2">
      <div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFile}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <LuUpload className="size-4" />
          {uploading ? 'Téléversement…' : 'Téléverser un document'}
        </Button>
      </div>
      {!documents || documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun document.</p>
      ) : (
        <ul className="grid gap-1">
          {documents.map((key) => (
            <li
              key={key}
              className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
            >
              <span className="truncate">{key.split('/').pop()}</span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(key)}
                >
                  <LuDownload className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(key)}
                >
                  <LuTrash2 className="size-4" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
