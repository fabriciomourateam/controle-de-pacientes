import { useState, useEffect } from 'react';
import heic2any from 'heic2any';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string; // The .heic URL passed as src
}

export function HeicImage({ src, className, alt, ...props }: HeicImageProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        async function convert() {
            try {
                setLoading(true);
                setError(false);

                // Fetch the HEIC file
                const response = await fetch(src, { mode: 'cors' });
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

                const blob = await response.blob();

                if (!active) return;

                // Verify blob type or convert anyway
                try {
                    const conversionResult = await heic2any({
                        blob,
                        toType: 'image/jpeg',
                        quality: 0.7 // Slightly lower quality for thumbnails/speed
                    });

                    if (!active) return;

                    const resultBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                    const url = URL.createObjectURL(resultBlob);
                    setBlobUrl(url);
                } catch (conversionError) {
                    console.error("HEIC conversion failed:", conversionError);
                    // Fallback: try to display original if conversion fails (maybe browser supports it?)
                    const url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                }

            } catch (err) {
                console.error("Error loading HEIC image:", err);
                if (active) setError(true);
            } finally {
                if (active) setLoading(false);
            }
        }

        if (src) {
            convert();
        } else {
            setLoading(false);
            setError(true);
        }

        return () => {
            active = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [src]);

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center bg-slate-800 animate-pulse", className)}>
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-slate-800", className)}>
                <ImageOff className="w-8 h-8 text-slate-500 mb-1" />
                <span className="text-[10px] text-slate-500">Erro</span>
            </div>
        );
    }

    return <img src={blobUrl} alt={alt} className={className} {...props} />;
}
