import { useMutation } from "@tanstack/react-query";

interface UploadResult {
  url: string;
  blurDataUrl?: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }

      const data = await res.json();
      return { url: data.url, blurDataUrl: data.blurDataUrl };
    },
  });
}
