import type { AxiosResponse } from "axios";
import type { FileDownloadResponse } from "./FileUtils.types";

export const downloadFileFromBlob = (
  res: AxiosResponse<BlobPart> | FileDownloadResponse,
  type: string,
  defaultFilename: string
): void => {
  const blob = new Blob([res.data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const filename = res.headers["x-filename"] || defaultFilename;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  if (link.parentNode) link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
