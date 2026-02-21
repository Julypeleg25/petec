export interface FileDownloadResponse {
  data: BlobPart;
  headers: Record<string, string>;
}
