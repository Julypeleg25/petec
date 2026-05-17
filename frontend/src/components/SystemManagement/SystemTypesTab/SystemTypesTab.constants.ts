import {
  systemTypesData,
  isSystemTypeKey,
  type SystemTypeConfig,
  type SystemTypeKey,
} from "../config";

export { isSystemTypeKey };
export type { SystemTypeKey };

export const SYSTEM_TYPE_OPTIONS: ReadonlyArray<{
  value: SystemTypeKey;
  text: string;
}> = (Object.entries(systemTypesData) as Array<[SystemTypeKey, SystemTypeConfig]>)
  .map(([value, config]) => ({
    value,
    text: config.label,
  }));
