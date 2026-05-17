import { TABLE_ALLOW_LIST, SortOrders } from "../constants/index.js";

export type AllowedTableName = (typeof TABLE_ALLOW_LIST)[number];
export type SortOrderKey = keyof typeof SortOrders;
export type SortOrder = (typeof SortOrders)[SortOrderKey];
