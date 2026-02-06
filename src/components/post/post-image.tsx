import Image from "next/image";

interface PostImageProps {
  src: string;
  alt?: string;
}

export function PostImage({ src, alt = "Post image" }: PostImageProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <Image
        src={src}
        alt={alt}
        width={600}
        height={512}
        className="max-h-[512px] w-full object-cover"
        unoptimized
      />
    </div>
  );
}
