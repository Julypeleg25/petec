import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toNestErrors } from "@hookform/resolvers";
import type { Resolver, FieldError, FieldValues } from "react-hook-form";

type ZodIssueLike = Readonly<{
  code?: string;
  path?: (string | number)[];
  message?: string;
}>;

type ZodErrorLike = Readonly<{
  issues?: ZodIssueLike[];
  errors?: ZodIssueLike[];
}>;
type ResolverErrorCandidate =
  | Record<string, ZodIssueLike[] | undefined>
  | string
  | number
  | boolean
  | null
  | undefined;

const NESTED_PATH_SEPARATOR = ".";
const ROOT_ERROR_PATH = "root";
const DEFAULT_VALIDATION_MESSAGE = "שגיאת אימות";
const DEFAULT_VALIDATION_TYPE = "custom";
const ALL_CRITERIA_MODE = "all";

const isZodErrorLike = (error: ResolverErrorCandidate): error is ZodErrorLike => {
  if (typeof error !== "object" || error === null) return false;
  const maybeError = error as ZodErrorLike;
  return Array.isArray(maybeError.issues) || Array.isArray(maybeError.errors);
};

const getIssues = (error: ZodErrorLike): ZodIssueLike[] => {
  if (Array.isArray(error.issues)) return error.issues;
  if (Array.isArray(error.errors)) return error.errors;
  return [];
};

const mapIssuesToFieldErrors = (
  issues: readonly ZodIssueLike[],
  criteriaMode?: "all" | "firstError",
): Record<string, FieldError> => {
  const errors: Record<string, FieldError> = {};

  for (const issue of issues) {
    const path = Array.isArray(issue.path) && issue.path.length > 0
      ? issue.path.join(NESTED_PATH_SEPARATOR)
      : ROOT_ERROR_PATH;
    const message = issue.message ?? DEFAULT_VALIDATION_MESSAGE;
    const type = issue.code ?? DEFAULT_VALIDATION_TYPE;
    const existing = errors[path];

    if (!existing) {
      errors[path] = { type, message };
      continue;
    }

    if (criteriaMode === ALL_CRITERIA_MODE) {
      const existingTypes = existing.types ?? {};
      errors[path] = {
        ...existing,
        types: {
          ...existingTypes,
          [type]: message,
        },
      };
    }
  }

  return errors;
};

export const getSharedResolver = <TSchema extends z.ZodTypeAny>(
  schema: TSchema
): Resolver<z.infer<TSchema> & FieldValues> => {
  const resolver = zodResolver(schema) as Resolver<z.infer<TSchema> & FieldValues>;

  return async (values, context, options) => {
    try {
      return await resolver(values, context, options);
    } catch (error) {
      if (!isZodErrorLike(error as ResolverErrorCandidate)) {
        throw error;
      }

      const issues = getIssues(error as ZodErrorLike);
      const fieldErrors = mapIssuesToFieldErrors(issues, options.criteriaMode);

      return {
        values: {},
        errors: toNestErrors(fieldErrors, options),
      };
    }
  };
};
