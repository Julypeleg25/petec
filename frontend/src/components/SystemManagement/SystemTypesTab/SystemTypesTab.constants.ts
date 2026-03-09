import {
  systemTypesData,
  type SystemTypeConfig,
  type SystemTypeKey,
} from "../SystemTypesData";

export { isSystemTypeKey, type SystemTypeKey } from "../SystemTypesData";

export const SYSTEM_TYPE_OPTIONS: ReadonlyArray<{
  value: SystemTypeKey;
  text: string;
}> = (Object.entries(systemTypesData) as Array<[SystemTypeKey, SystemTypeConfig]>)
  .map(([value, config]) => ({
    value,
    text: config.label,
  }));
