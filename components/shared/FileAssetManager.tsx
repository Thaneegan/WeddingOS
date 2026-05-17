"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Trash2 } from "lucide-react";
import { deleteFileAsset, getSignedFileUrl } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import type { CoreFileAsset } from "@/types/core";
import { FileAssetUploader } from "./FileAssetUploader";

type FileAssetManagerProps = {
  ownerType: "WEDDING" | "EVENT" | "VENDOR_BUSINESS" | "BOOKING";
  ownerId: string;
  purpose: "CONTRACT" | "INVOICE" | "GALLERY" | "PORTFOLIO" | "INSPIRATION" | "RSVP_IMPORT" | "MISC";
  label: string;
  description?: string;
  files: CoreFileAsset[];
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function FileAssetManager({ ownerType, ownerId, purpose, label, description, files }: FileAssetManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  return (
    <div className="space-y-3">
      <FileAssetUploader ownerType={ownerType} ownerId={ownerId} purpose={purpose} label={label} description={description} />
      {status ? <p className="text-sm font-semibold text-[#61735f]">{status}</p> : null}
      <div className="rounded-2xl border border-[#eee7dd] bg-white">
        {files.length ? (
          files.map((file) => (
            <div key={file.id} className="flex flex-col gap-3 border-b border-[#eee7dd] p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold text-[#191714]">
                  <FileText size={16} className="shrink-0 text-[#9a7a50]" />
                  {file.fileName}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f877a]">
                  {file.purpose.replaceAll("_", " ")} - {formatBytes(file.sizeBytes)} - {formatDate(file.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const result = await getSignedFileUrl({ fileAssetId: file.id });
                    if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61]"
                >
                  <Download size={15} />
                  Open
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteFileAsset({ fileAssetId: file.id });
                    setStatus(`${file.fileName} deleted.`);
                    router.refresh();
                  }}
                  className="flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#93484d]"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-[#6f6a61]">No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
