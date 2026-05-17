export interface ColumnDef {
  colName: string;
  searchObjField: string;
  minWidth?: string;
  hide?: boolean;
  defaultValue?: string | number | boolean;
  formatter?: (cellValue: string | number | boolean | null | undefined | object, rowData: Record<string, string | number | boolean | null | undefined | object>) => React.ReactNode;
  isDateSearch?: boolean;
  searchDefaultVal?: string | number;
  isDisabled?: boolean;
  hideSearch?: boolean;
  center?: boolean;
  placeholder?: string;
  customFilter?: boolean;
  customFilterVal?: string;
}
