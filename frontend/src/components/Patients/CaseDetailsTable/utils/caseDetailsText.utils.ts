export const getBooleanValueText = (
  val?: boolean | null,
  commentVal?: string | null,
): string | null => {
  if (val == null) return null;

  if (val === true) {
    return commentVal && commentVal.length > 0 ? `כן, ${commentVal}` : "כן";
  }

  return commentVal && commentVal.length > 0 ? `לא, ${commentVal}` : "לא";
};

export const getSelectValueText = (
  val?: string | null,
  commentVal?: string | null,
): string | null => {
  if (val == null) return null;
  return commentVal && commentVal.length > 0 ? `${val}, ${commentVal}` : val;
};
