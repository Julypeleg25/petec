export type SafeJsonPrimitive = string | number | boolean | null;

export interface SafeJsonObject {
  [key: string]: SafeJsonValue;
}

export type SafeJsonValue = SafeJsonPrimitive | SafeJsonObject | readonly SafeJsonValue[];
