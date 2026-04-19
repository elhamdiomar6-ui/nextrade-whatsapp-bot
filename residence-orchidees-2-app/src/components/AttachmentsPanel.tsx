"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import {
  Paperclip, Camera, Upload, Trash2, Download,
  FileText, FileSpreadsheet, FileImage, Film, File,
  Loader2, ChevronDown, ChevronUp, X, Play, ExternalLink,
} from "lucide-react";
import { addAttachment, deleteAttachment, type AttachmentRow } from "@/actions/attachments";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))  return <FileImage size={16} className="text-blue-500" />;
  if (mimeType.startsWith("video/"))  return <Film       size={16} className="text-purple-500" />;
  if (mimeType.includes("pdf"))       return <FileText   size={16} className="text-red-500" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet size={16} className="text-green-600" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText size={16} className="text-blue-600" />;
  return <File size={16} className="text-gray-400" />;
}

const DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx";
const IMG_ACCEPT = "image/*,video/*";

// ── Types ──────────────────────────────────────────────────────────────────────

type PreviewItem = { url: string; type: "image" | "video" };

interface Props {
  entityType: string;
  entityId: string;
  initialAttachments: AttachmentRow[];
  readOnly?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttachmentsPanel({
  entityType,
  entityId,
  initialAttachments,
  readOnly = false,
  collapsible = false,
  defaultOpen = false,
}: Props) {
  const { data: session } = useSession();
  const { lang } = useLang();
  const router = useRouter();
  const isViewer = session?.user?.role === "VIEWER";
  const canEdit  = !readOnly && !isViewer;

  const [open,        setOpen]        = useState(defaultOpen || !collapsible);
  const [attachments, setAttachments] = useState<AttachmentRow[]>(initialAttachments);
  const [uploading,   setUploading]   = useState(false);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [preview,     setPreview]     = useState<PreviewItem | null>(null);
  const [error,       setError]       = useState("");

  const docRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const total = attachments.length;

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entityType", entityType);
        fd.append("entityId", entityId);
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const newAtt = await addAttachment({
          url:      data.url,
          name:     data.name,
          mimeType: data.mimeType,
          size:     data.size,
          entityType,
          entityId,
        });
        setAttachments((prev) => [newAtt, ...prev]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
      if (docRef.current) docRef.current.value = "";
      if (imgRef.current) imgRef.current.value = "";
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (att: AttachmentRow) => {
    setDeleteId(att.id);
    try {
      await deleteAttachment(att.id, att.url, entityType);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      router.refresh();
    } catch {
      setError("Suppression échouée");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = (
    <div
      className={`flex items-center gap-2 ${collapsible ? "cursor-pointer select-none" : ""}`}
      onClick={() => collapsible && setOpen((v) => !v)}
    >
      <Paperclip size={14} className="text-gray-400 shrink-0" />
      <span className="text-xs font-medium text-gray-600">
        {lang === "fr" ? "Documents & Médias" : "المستندات والوسائط"}
      </span>
      {total > 0 && (
        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
          {total}
        </span>
      )}
      {uploading && <Loader2 size={13} className="text-green-600 animate-spin ml-1" />}
      {collapsible && (
        open
          ? <ChevronUp size={14} className="text-gray-400 ml-auto" />
          : <ChevronDown size={14} className="text-gray-400 ml-auto" />
      )}
    </div>
  );

  if (!open) return (
    <div className="pt-2 border-t border-gray-100">{header}</div>
  );

  // ── Attachment categories ───────────────────────────────────────────────────
  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const videos = attachments.filter((a) => a.mimeType.startsWith("video/"));
  const docs   = attachments.filter((a) => !a.mimeType.startsWith("image/") && !a.mimeType.startsWith("video/"));

  return (
    <div className="pt-2 border-t border-gray-100 space-y-2">
      {header}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">{error}</p>
      )}

      {/* ── Photo thumbnails ── */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((att) => (
            <div
              key={att.id}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={att.url}
                alt={att.name}
                className="w-full h-full object-cover"
                onClick={() => setPreview({ url: att.url, type: "image" })}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  download={att.name}
                  className="p-1 bg-white/80 rounded text-gray-700 hover:bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={11} />
                </a>
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(att); }}
                    disabled={deleteId === att.id}
                    className="p-1 bg-white/80 rounded text-red-600 hover:bg-white"
                  >
                    {deleteId === att.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Video thumbnails ── */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((att) => (
            <div
              key={att.id}
              className="relative group w-24 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-900 cursor-pointer flex items-center justify-center"
              onClick={() => setPreview({ url: att.url, type: "video" })}
            >
              <Play size={20} className="text-white opacity-80" />
              <span className="absolute bottom-1 left-1 right-1 text-white text-[9px] truncate text-center">
                {att.name}
              </span>
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1 gap-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  download={att.name}
                  className="p-1 bg-white/80 rounded text-gray-700 hover:bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={11} />
                </a>
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(att); }}
                    disabled={deleteId === att.id}
                    className="p-1 bg-white/80 rounded text-red-600 hover:bg-white"
                  >
                    {deleteId === att.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Documents list (PDF, Word, Excel…) ── */}
      {docs.length > 0 && (
        <div className="space-y-1">
          {docs.map((att) => {
            const isPdf = att.mimeType.includes("pdf");
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-2 py-1.5 group"
              >
                <FileIcon mimeType={att.mimeType} />
                <span className="flex-1 truncate text-gray-700 font-medium">{att.name}</span>
                <span className="text-gray-400 shrink-0">{formatSize(att.size)}</span>
                {isPdf && (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title={lang === "fr" ? "Aperçu PDF" : "معاينة PDF"}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  download={att.name}
                  className="p-1 text-gray-400 hover:text-green-700 rounded transition-colors"
                  title={lang === "fr" ? "Télécharger" : "تنزيل"}
                >
                  <Download size={13} />
                </a>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(att)}
                    disabled={deleteId === att.id}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title={lang === "fr" ? "Supprimer" : "حذف"}
                  >
                    {deleteId === att.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <p className="text-xs text-gray-400 italic">
          {lang === "fr" ? "Aucune pièce jointe" : "لا توجد مرفقات"}
        </p>
      )}

      {/* ── Upload buttons (admin only) ── */}
      {canEdit && (
        <div className="flex gap-2">
          <button
            onClick={() => docRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50"
          >
            <Upload size={12} />
            {lang === "fr" ? "Document / PDF" : "مستند / PDF"}
          </button>
          <button
            onClick={() => imgRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            <Camera size={12} />
            {lang === "fr" ? "Photo / Vidéo" : "صورة / فيديو"}
          </button>

          <input ref={docRef} type="file" multiple accept={DOC_ACCEPT} className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          <input ref={imgRef} type="file" multiple accept={IMG_ACCEPT} capture="environment" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}

      {/* ── Lightbox (image ou vidéo) ── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setPreview(null)}
          >
            <X size={28} />
          </button>

          {preview.type === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={preview.url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview.url}
              alt="Aperçu"
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
