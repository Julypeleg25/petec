import type { ApiErrorDetails } from "@petec/shared";
import type { z } from "zod";

type IssuePathSegment = string | number | symbol;

export type ZodIssueLogEntry = Readonly<{
  index: number;
  path: string;
  code: string;
  message: string;
  origin?: string;
  expected?: string;
  received?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  exact?: boolean;
  keys?: readonly string[];
}>;

export type ZodIssuePathSummary = Readonly<{
  path: string;
  issue_count: number;
  codes: readonly string[];
  messages: readonly string[];
}>;

export type ZodIssueLogMeta = Readonly<{
  zod_issue_count: number;
  zod_issue_paths: readonly string[];
  zod_issue_code_counts: Readonly<Record<string, number>>;
  zod_issues_by_path: readonly ZodIssuePathSummary[];
  zod_issue_truncated_count: number;
  zod_issues: readonly ZodIssueLogEntry[];
}>;

const PATH_SEGMENT_IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const MAX_DETAILED_ZOD_ISSUES = 50;
type MetaValue =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | object;

const toMetaString = (value: MetaValue): string => {
  if (value === undefined) return "undefined";
  if (value === null) return "null";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized === "string") {
      return serialized;
    }
  } catch {
  }

  return String(value);
};

const toIssuePath = (segments: readonly IssuePathSegment[]): string => {
  if (segments.length === 0) return "_root";

  let path = "";
  for (const segment of segments) {
    if (typeof segment === "number") {
      path += `[${segment}]`;
      continue;
    }

    const token = typeof segment === "symbol" ? segment.toString() : segment;
    if (path.length === 0) {
      path = token;
      continue;
    }

    if (PATH_SEGMENT_IDENTIFIER_REGEX.test(token)) {
      path += `.${token}`;
      continue;
    }

    path += `[${JSON.stringify(token)}]`;
  }

  return path || "_root";
};

const normalizeIssue = (issue: z.ZodIssue, index: number): ZodIssueLogEntry => {
  const normalized: {
    index: number;
    path: string;
    code: string;
    message: string;
    origin?: string;
    expected?: string;
    received?: string;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    inclusive?: boolean;
    exact?: boolean;
    keys?: readonly string[];
  } = {
    index,
    path: toIssuePath(issue.path as readonly IssuePathSegment[]),
    code: issue.code,
    message: issue.message,
  };

  if ("origin" in issue && typeof issue.origin === "string") {
    normalized.origin = issue.origin;
  }

  if ("expected" in issue && issue.expected !== undefined) {
    normalized.expected = toMetaString(issue.expected as MetaValue);
  }

  if ("received" in issue && issue.received !== undefined) {
    normalized.received = toMetaString(issue.received as MetaValue);
  }

  if ("format" in issue && typeof issue.format === "string") {
    normalized.format = issue.format;
  }

  if ("pattern" in issue && typeof issue.pattern === "string") {
    normalized.pattern = issue.pattern;
  }

  if ("minimum" in issue && typeof issue.minimum === "number") {
    normalized.minimum = issue.minimum;
  }

  if ("maximum" in issue && typeof issue.maximum === "number") {
    normalized.maximum = issue.maximum;
  }

  if ("inclusive" in issue && typeof issue.inclusive === "boolean") {
    normalized.inclusive = issue.inclusive;
  }

  if ("exact" in issue && typeof issue.exact === "boolean") {
    normalized.exact = issue.exact;
  }

  if ("keys" in issue && Array.isArray(issue.keys)) {
    const keys = issue.keys
      .filter((value): value is string => typeof value === "string")
      .sort((a, b) => a.localeCompare(b));
    if (keys.length > 0) {
      normalized.keys = keys;
    }
  }

  return normalized;
};

const byPathThenCodeThenMessage = (a: ZodIssueLogEntry, b: ZodIssueLogEntry): number => {
  const pathComparison = a.path.localeCompare(b.path);
  if (pathComparison !== 0) return pathComparison;

  const codeComparison = a.code.localeCompare(b.code);
  if (codeComparison !== 0) return codeComparison;

  const messageComparison = a.message.localeCompare(b.message);
  if (messageComparison !== 0) return messageComparison;

  return a.index - b.index;
};

const toCodeCounts = (issues: readonly ZodIssueLogEntry[]): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right)),
  );
};

const toPathSummaries = (issues: readonly ZodIssueLogEntry[]): ZodIssuePathSummary[] => {
  const grouped = new Map<string, { codes: Set<string>; messages: Set<string>; issueCount: number }>();

  for (const issue of issues) {
    const current = grouped.get(issue.path) ?? {
      codes: new Set<string>(),
      messages: new Set<string>(),
      issueCount: 0,
    };
    current.issueCount += 1;
    current.codes.add(issue.code);
    current.messages.add(issue.message);
    grouped.set(issue.path, current);
  }

  return [...grouped.entries()]
    .map(([path, summary]) => ({
      path,
      issue_count: summary.issueCount,
      codes: [...summary.codes].sort((a, b) => a.localeCompare(b)),
      messages: [...summary.messages].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
};

export const formatZodIssuesForLog = (
  issues: readonly z.ZodIssue[],
): ZodIssueLogMeta => {
  const normalizedIssues = issues
    .map((issue, index) => normalizeIssue(issue, index))
    .sort(byPathThenCodeThenMessage);

  const detailedIssues = normalizedIssues.slice(0, MAX_DETAILED_ZOD_ISSUES);
  const pathSummaries = toPathSummaries(normalizedIssues);

  return {
    zod_issue_count: normalizedIssues.length,
    zod_issue_paths: pathSummaries.map((summary) => summary.path),
    zod_issue_code_counts: toCodeCounts(normalizedIssues),
    zod_issues_by_path: pathSummaries,
    zod_issue_truncated_count: normalizedIssues.length - detailedIssues.length,
    zod_issues: detailedIssues,
  };
};

export const toValidationErrorDetails = (issues: readonly z.ZodIssue[]): ApiErrorDetails => {
  const grouped = new Map<string, Set<string>>();

  for (const issue of issues) {
    const path = toIssuePath(issue.path as readonly IssuePathSegment[]);
    const messages = grouped.get(path) ?? new Set<string>();
    messages.add(issue.message);
    grouped.set(path, messages);
  }

  const sortedPaths = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
  const details: Record<string, readonly string[]> = {};

  for (const path of sortedPaths) {
    const messages = grouped.get(path);
    details[path] = messages
      ? [...messages].sort((a, b) => a.localeCompare(b))
      : [];
  }

  return details;
};
