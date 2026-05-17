"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload } from "lucide-react";
import { uploadFileAsset } from "@/app/actions";

type FileAssetUploaderProps = {
  ownerType: "WEDDING" | "EVENT" | "VENDOR_BUSINESS" | "BOOKING";
  ownerId: string;
  purpose: "CONTRACT" | "INVOICE" | "GALLERY" | "PORTFOLIO" | "INSPIRATION" | "RSVP_IMPORT" | "MISC";
  label: string;
  description?: string;
};

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FileAssetUploader({ ownerType, ownerId, purpose, label, description }: FileAssetUploaderProps) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const file = new FormData(event.currentTarget).get("file");
        if (!(file instanceof File) || !file.name) return;
        setPending(true);
        setStatus("");
        try {
          const bytesBase64 = await toBase64(file);
          await uploadFileAsset({
            ownerType,
            ownerId,
            purpose,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            bytesBase64,
            visibility: "WORKSPACE",
          });
          setStatus(`${file.name} uploaded`);
          event.currentTarget.reset();
          router.refresh();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Upload failed.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-semibold text-[#191714]">
            <Paperclip size={17} />
            {label}
          </p>
          {description ? <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{description}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            name="file"
            type="file"
            className="max-w-full rounded-full border border-[#e7dfd3] bg-white px-3 py-2 text-sm"
            required
          />
          <button
            disabled={pending}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Upload size={16} />
            {pending ? "Uploading" : "Upload"}
          </button>
        </div>
      </div>
      {status ? <p className="mt-3 text-sm font-semibold text-[#61735f]">{status}</p> : null}
    </form>
  );
}
