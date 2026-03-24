export const getValForFormData = (val: any) => {
  return val === null || val.toString() === "" ? null : val;
};
