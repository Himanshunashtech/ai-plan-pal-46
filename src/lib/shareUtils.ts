import { toBlob } from 'html-to-image';
import { toast } from 'sonner';

/**
 * Captures a DOM element as an image and shares it using the Web Share API.
 * @param element The DOM element to capture.
 * @param fileName The name of the file to share.
 * @param shareText The text to accompany the share.
 */
export async function captureAndShareImage(
    element: HTMLElement,
    fileName: string,
    shareText: string
) {
    try {
        // Basic options for better quality and handling of gradients/styles
        const blob = await toBlob(element, {
            cacheBust: true,
            backgroundColor: 'transparent',
        });

        if (!blob) {
            throw new Error('Failed to generate image blob');
        }

        const file = new File([blob], `${fileName}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: fileName,
                text: shareText,
            });
            return true;
        } else {
            // Fallback: Download the image if sharing files is not supported
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.info('Sharing image not supported on this browser. Image downloaded instead.');
            return false;
        }
    } catch (error) {
        console.error('Error capturing or sharing image:', error);
        toast.error('Failed to share image. Please try again.');
        return false;
    }
}
