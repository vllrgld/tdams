export const DOCUMENT_FILE_ACCEPT =
    '.pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function documentFileError(
    file: Pick<File, 'name' | 'size'>,
): string | null {
    if (!/\.(pdf|jpe?g|png|tiff?)$/i.test(file.name)) {
        return 'Choose a PDF, JPEG, PNG, or TIFF file.';
    }

    if (file.size === 0) {
        return 'This file is empty. Choose another document.';
    }

    if (file.size > MAX_FILE_SIZE) {
        return 'This file is larger than 50 MB. Choose a smaller document.';
    }

    return null;
}
