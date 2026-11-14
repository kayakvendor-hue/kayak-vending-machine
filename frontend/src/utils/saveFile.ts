// Saves a downloaded file. The link is added to the page and the blob uses a generic binary type,
// because mobile browsers ignore the download attribute on detached links and open PDFs in a viewer.
// The object URL is revoked after a delay so the download is not cancelled.
export const saveFile = (data: BlobPart, filename: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
