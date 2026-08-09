const CLOUDINARY_UPLOAD_MARKER = "/upload/";
export const CLOUDINARY_HIGH_RES_TRANSFORMS =
  "f_auto,q_auto:best,c_limit,w_1200,dpr_auto";

const looksLikeTransformSegment = (segment: string): boolean => {
  if (segment.length === 0 || segment.includes(".")) {
    return false;
  }

  return /[,_]/.test(segment);
};

export const toHighResolutionCloudinaryUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }

  const uploadIndex = trimmed.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (uploadIndex < 0) {
    return value;
  }

  const prefix = trimmed.slice(0, uploadIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const afterUpload = trimmed.slice(uploadIndex + CLOUDINARY_UPLOAD_MARKER.length);

  if (afterUpload.startsWith(`${CLOUDINARY_HIGH_RES_TRANSFORMS}/`)) {
    return trimmed;
  }

  const segments = afterUpload.split("/");
  let assetStartIndex = 0;
  while (
    assetStartIndex < segments.length &&
    looksLikeTransformSegment(segments[assetStartIndex])
  ) {
    assetStartIndex += 1;
  }

  const assetPath = segments.slice(assetStartIndex).join("/");
  if (assetPath.length === 0) {
    return value;
  }

  return `${prefix}${CLOUDINARY_HIGH_RES_TRANSFORMS}/${assetPath}`;
};
