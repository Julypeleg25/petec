import { useEffect, useMemo, useRef, useState } from "react";
import { getCaseSerialPrefix } from "@petec/shared";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaHospital,
  FaTimes,
} from "react-icons/fa";
import {
  fetchClinicaPetVisits,
  fetchClinicaVisitsForCase,
  getClinicaClientByCasePrefix,
  getClinicaClientByExternalPatientId,
} from "../api/clinica.api";
import type {
  ClinicaClient,
  ClinicaMedicalRecord,
  ClinicaVisitTable,
} from "../types/clinicaClient.types";
import "./ClinicaVisitsTable.css";

interface ClinicaVisitsTableProps {
  externalPatientId: string;
  ownerPhone?: string;
  patientName?: string;
}

type VisitsState =
  | { status: "idle" | "loading" | "not-found" }
  | { status: "error" }
  | { status: "ready"; table: ClinicaVisitTable; syncedAt?: string };

const DEFAULT_PAGE_SIZE = 10;
const DATE_PATTERN = /(\d{1,2}[./-]\d{1,2}[./-](?:\d{4}|\d{2}))/;
const COMPACT_DATE_TIME_PATTERN = /(\d{1,2}[./-]\d{1,2}[./-](?:\d{4}|\d{2}))(?=\d{1,2}:\d{2})/g;
const DOCUMENT_URL_PATTERN = /(https?:\/\/[^\s]+)/gi;
const BROKEN_DOCUMENT_URL_PATTERN = /https?:\/\/(?:(?:https?):?\/{1,2})?www\.(?:\/)?/i;
const VETCONNECT_DOCUMENT_PATH_PATTERN = /(?:www\s*\.\s*)?vetconnectplus\s*\.\s*com(?:\s*\.\s*au)?\s*\/\s*diagnostics\s*\/\s*\d+\s*\/\s*[\d-]+/i;
const buildVetConnectDocumentUrl = (
  diagnosticId: string,
  resultId: string,
  hostname = "www.vetconnectplus.com",
): string => {
  return `https://${hostname}/diagnostics/${diagnosticId}/${resultId}`;
};
const TIME_AND_DAYS_PATTERN = /(\d{1,2}:\d{2})\s*(\d+)\s*(ימים)/g;
const CLINICA_LABEL_PATTERN = /(הרופא|מבצע המעקב|מעקב|סטטוס|תאריך|טיפול|אבחנה|הערות|סניף|פריטים|סה[״"']?כ):/g;

const READABLE_CLINICA_LABEL_PATTERN = new RegExp(
  "(\\u05d4\\u05d9\\u05e1\\u05d8\\u05d5\\u05e8\\u05d9\\u05d4 \\u05d5\\u05e1\\u05d9\\u05d1\\u05ea \\u05d4\\u05d1\\u05d9\\u05e7\\u05d5\\u05e8|" +
    "\\u05de\\u05de\\u05e6\\u05d0\\u05d9\\u05dd \\u05d5\\u05d1\\u05d3\\u05d9\\u05e7\\u05d5\\u05ea|" +
    "\\u05de\\u05d1\\u05e6\\u05e2 \\u05d4\\u05de\\u05e2\\u05e7\\u05d1|" +
    "\\u05d4\\u05e8\\u05d5\\u05e4\\u05d0|\\u05de\\u05e2\\u05e7\\u05d1|\\u05e1\\u05d8\\u05d8\\u05d5\\u05e1|" +
    "\\u05ea\\u05d0\\u05e8\\u05d9\\u05da|\\u05d8\\u05d9\\u05e4\\u05d5\\u05dc|\\u05d0\\u05d1\\u05d7\\u05e0\\u05d4|" +
    "\\u05d4\\u05e2\\u05e8\\u05d5\\u05ea|\\u05e1\\u05e0\\u05d9\\u05e3|\\u05e4\\u05e8\\u05d9\\u05d8\\u05d9\\u05dd|" +
    "\\u05e1\\u05d4[\\u05f3\\u05f4\"']?\\u05db)\\s*:",
  "g",
);

const makeCellReadable = (value: string): string => {
  return value
    .replace(/(\d)\.\s+(?=\d)/g, "$1.")
    .replace(/\b(\d+(?:\.\d+)?)\s*-(?=\s*(?:;|$))/g, "-$1")
    .replace(/(?<=[a-z])(?=[A-Z])/g, "\n")
    .replace(/(?<=[A-Za-z])(?=[\u0590-\u05ff])/g, "\n")
    .replace(/(?<=[\u0590-\u05ff])(?=[A-Za-z])/g, "\n")
    .replace(/(?<=\d)(?=[A-Za-z\u0590-\u05ff])/g, "\n")
    .replace(/(?<=[A-Za-z\u0590-\u05ff])(?=\d)/g, "\n")
    .replace(/(?<=\))(?=[A-Za-z\u0590-\u05ff])/g, "\n")
    .replace(COMPACT_DATE_TIME_PATTERN, "$1 ")
    .replace(TIME_AND_DAYS_PATTERN, (_match, time: string, days: string, unit: string) =>
      `${time}\n${Number(days).toLocaleString("he-IL")} ${unit}`,
    )
    .replace(CLINICA_LABEL_PATTERN, (label, _name, offset) =>
      `${offset > 0 ? "\n" : ""}${label} `,
    )
    .replace(READABLE_CLINICA_LABEL_PATTERN, (label, _name, offset) =>
      `${offset > 0 ? "\n" : ""}${label} `,
    )
    .replace(/(דווח למרפא[הט]):/g, (label, _name, offset) =>
      `${offset > 0 ? "\n" : ""}${label} `,
    )
    .replace(/([.!?])(?=\p{L})/gu, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const makeCellReadablePreservingUrls = (value: string): string => {
  const protectedUrls: Array<{ token: string; url: string }> = [];
  const protectedValue = value.replace(DOCUMENT_URL_PATTERN, (url) => {
    const token = `\uE000${"X".repeat(protectedUrls.length + 1)}\uE001`;
    protectedUrls.push({ token, url });
    return token;
  });
  let readableValue = makeCellReadable(protectedValue);

  for (const { token, url } of protectedUrls) {
    readableValue = readableValue.replace(token, url);
  }

  return readableValue;
};

const normalizeDocumentUrls = (value: string): string => {
  let normalized = value.replace(
    /\b(https?)\s*:\s*\/\s*\/\s*/gi,
    "$1://",
  );
  normalized = normalized.replace(
    /\b(https?:\/\/(?:www\.)?)\/\s*(?=(?:[a-z0-9-]+\s*\.\s*)+[a-z]{2,})/gi,
    "$1",
  );
  let previousValue = "";

  // Clinica sometimes wraps a URL after a dot, slash, or query separator.
  // Join only those URL continuations so ordinary words remain untouched.
  while (previousValue !== normalized) {
    previousValue = normalized;
    normalized = normalized.replace(
      /(https?:\/\/[^\s\u0590-\u05ff]*[./?&=_-])\s+(?=[a-z0-9%])/gi,
      "$1",
    );
  }

  return normalized;
};

const normalizeMarpetReportStatus = (value: string): string => {
  const normalized = value.trim().toLocaleLowerCase("he-IL");
  const isCompleted =
    !/\u05dc\u05d0\s+\u05d1\u05d5\u05e6\u05e2/u.test(normalized) &&
    /(?:\u05d1\u05d5\u05e6\u05e2|\u05db\u05df|true|checked|[✓✔])/u.test(normalized);

  return isCompleted ? "\u05d1\u05d5\u05e6\u05e2" : "\u05dc\u05d0 \u05d1\u05d5\u05e6\u05e2";
};

const normalizeVisitRowDocuments = (row: string[]): string[] => {
  if (!row.some((cell) => BROKEN_DOCUMENT_URL_PATTERN.test(cell))) return row;

  const pathMatch = row.join("\n").match(VETCONNECT_DOCUMENT_PATH_PATTERN)?.[0];
  if (!pathMatch) return row;

  const normalizedPath = pathMatch
    .replace(/\s+/g, "")
    .replace(/^(?:www\.)?vetconnectplus\.com(?:\.au)?\/diagnostics\//i, "");
  const [diagnosticId, resultId] = normalizedPath.split("/");
  const documentUrl = buildVetConnectDocumentUrl(diagnosticId, resultId);
  const preferredCellIndex = row.findIndex(
    (cell) => /(?:\u05de\u05e1\u05de\u05da|\u05dc\u05d7\u05e5 \u05db\u05d0\u05df)/u.test(cell),
  );
  const targetCellIndex = preferredCellIndex >= 0
    ? preferredCellIndex
    : row.findIndex((cell) => /https?:\/\/www\.\//i.test(cell));
  let linkWasAdded = false;

  return row.map((cell, cellIndex) => {
    let normalizedCell = cell.replace(
      new RegExp(VETCONNECT_DOCUMENT_PATH_PATTERN.source, "gi"),
      "",
    );
    normalizedCell = normalizedCell
      .replace(/(?:www\s*\.\s*)?vetconnectplus\s*\.\s*/gi, "")
      .replace(/com(?:\s*\.\s*au)?\s*\/\s*diagnostics\s*\/\s*\d+\s*\/\s*[\d-]+/gi, "");
    normalizedCell = normalizedCell.replace(
      new RegExp(BROKEN_DOCUMENT_URL_PATTERN.source, "gi"),
      () => {
        if (cellIndex !== targetCellIndex || linkWasAdded) return "";
        linkWasAdded = true;
        return documentUrl;
      },
    );

    if (cellIndex === targetCellIndex && !linkWasAdded) {
      linkWasAdded = true;
      normalizedCell = `${normalizedCell.trim()}\n${documentUrl}`;
    }

    return normalizedCell.replace(/\n{3,}/g, "\n\n").trim();
  });
};

const extractVetConnectDocumentUrl = (values: string[]): string | undefined => {
  const combinedValue = values.join("\n");
  const encodedReturnUrl = combinedValue.match(
    /returnUrl=(?:%2F|\/)diagnostics(?:%2F|\/)(\d{6,})(?:%2F|\/)(\d{6,}[a-z0-9-]*)/i,
  );
  if (encodedReturnUrl) {
    return buildVetConnectDocumentUrl(encodedReturnUrl[1], encodedReturnUrl[2]);
  }
  const diagnosticIds = combinedValue.match(
    /diagnostics[\s/\\:]*(\d{6,})[\s/\\:]*(\d{6,}[a-z0-9-]*)/i,
  );
  if (diagnosticIds) {
    return buildVetConnectDocumentUrl(diagnosticIds[1], diagnosticIds[2]);
  }

  const pathMatch = combinedValue.match(VETCONNECT_DOCUMENT_PATH_PATTERN)?.[0];
  if (!pathMatch) return undefined;

  const normalizedPath = pathMatch
    .replace(/\s+/g, "")
    .replace(/^(?:www\.)?vetconnectplus\.com(?:\.au)?\/diagnostics\//i, "");
  const [diagnosticId, resultId] = normalizedPath.split("/");
  return buildVetConnectDocumentUrl(diagnosticId, resultId);
};

const repairDocumentCell = (value: string, documentUrl?: string): string => {
  if (!documentUrl) return value;
  if (BROKEN_DOCUMENT_URL_PATTERN.test(value)) {
    return value.replace(
      new RegExp(BROKEN_DOCUMENT_URL_PATTERN.source, "gi"),
      documentUrl,
    );
  }

  const repairedValue = value
    .replace(new RegExp(VETCONNECT_DOCUMENT_PATH_PATTERN.source, "gi"), "")
    .replace(/(?:www\s*\.\s*)?vetconnectplus\s*\.\s*/gi, "")
    .replace(/com(?:\s*\.\s*au)?\s*\/\s*diagnostics\s*\/\s*\d+\s*\/\s*[\d-]+/gi, "")
    .trim();

  return /(?:\u05de\u05e1\u05de\u05da|\u05dc\u05d7\u05e5 \u05db\u05d0\u05df)/u.test(value)
    ? `${repairedValue}\n${documentUrl}`.trim()
    : repairedValue;
};

const getSafeDocumentHref = (value: string): string | undefined => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (
      !url.hostname ||
      /^(?:www\.?|https?|localhost)$/i.test(url.hostname)
    ) return undefined;
    const diagnosticMatch = url.pathname.match(
      /^\/diagnostics\/(\d+)\/([a-z0-9-]+)\/?$/i,
    );
    const isVetConnect = /^(?:www\.)?vetconnectplus\.com(?:\.au)?$/i.test(url.hostname);
    if (isVetConnect) {
      if (diagnosticMatch) {
        // Keep the concrete diagnostics route (and its regional host). Sending
        // every result through /login caused VetConnect to discard returnUrl
        // in some login flows and land on the home page instead.
        return buildVetConnectDocumentUrl(
          diagnosticMatch[1],
          diagnosticMatch[2],
          url.hostname,
        );
      }

      const returnUrl = url.searchParams.get("returnUrl") ?? "";
      const returnUrlMatch = returnUrl.match(
        /^\/diagnostics\/(\d+)\/([a-z0-9-]+)\/?$/i,
      );
      return returnUrlMatch
        ? buildVetConnectDocumentUrl(returnUrlMatch[1], returnUrlMatch[2], url.hostname)
        : undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
};

const TextWithDocumentLinks = ({ text }: { text: string }) => {
  const parts = normalizeDocumentUrls(text).split(DOCUMENT_URL_PATTERN);
  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part;
    const href = getSafeDocumentHref(part);
    if (!href) return null;

    return (
      <a
        key={`${index}-${part}`}
        href={href}
        rel="noreferrer external"
        className="clinica-visits__document-link"
      >
        פתיחת מסמך
      </a>
    );
  });
};

const ReadableCellText = ({
  documentUrl,
  value,
}: {
  documentUrl?: string;
  value: string;
}) => {
  const effectiveDocumentUrl =
    extractVetConnectDocumentUrl([value]) ?? documentUrl;
  const documentHref = effectiveDocumentUrl
    ? getSafeDocumentHref(effectiveDocumentUrl)
    : undefined;
  const hasDocumentLabel = /\u05de\u05e1\u05de\u05da/u.test(value);
  const lines = makeCellReadablePreservingUrls(
    normalizeDocumentUrls(repairDocumentCell(value, effectiveDocumentUrl)),
  ).split("\n");
  return (
    <span className="clinica-visits__formatted-text">
      {lines.map((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return null;
        if (
          documentHref &&
          hasDocumentLabel &&
          getSafeDocumentHref(cleanLine) === documentHref
        ) return null;
              if (/^[A-Za-z\u05d0-\u05ea]$/u.test(cleanLine)) return null;
        const colonIndex = cleanLine.indexOf(":");
        const possibleTitle = colonIndex > 0 ? cleanLine.slice(0, colonIndex).trim() : "";
        const hasFieldTitle =
          colonIndex > 0 &&
          possibleTitle.length <= 80 &&
          !/^https?$/i.test(possibleTitle) &&
          !possibleTitle.includes(";") &&
          /\p{L}/u.test(possibleTitle);
        if (hasFieldTitle) {
          const fieldValue = cleanLine.slice(colonIndex + 1).trim();
          const isDocumentField = /^\u05de\u05e1\u05de\u05da$/u.test(possibleTitle);
          const displayedFieldValue = /^\u05d3\u05d5\u05d5\u05d7 \u05dc\u05de\u05e8\u05e4\u05d0[\u05d4\u05d8]$/u.test(possibleTitle)
            ? normalizeMarpetReportStatus(fieldValue)
            : fieldValue;
          return (
            <span key={`${index}-${cleanLine}`} className="clinica-visits__field-row">
              <strong className="clinica-visits__field-title">{possibleTitle}:</strong>{" "}
              {isDocumentField && documentHref ? (
                <a
                  href={documentHref}
                  rel="noreferrer external"
                  className="clinica-visits__document-link"
                >
                  {displayedFieldValue || "\u05e4\u05ea\u05d9\u05d7\u05ea \u05de\u05e1\u05de\u05da"}
                </a>
              ) : displayedFieldValue ? (
                <span className="clinica-visits__field-value">
                  <TextWithDocumentLinks text={displayedFieldValue} />
                </span>
              ) : null}
            </span>
          );
        }
        return (
          <span key={`${index}-${cleanLine}`} className="clinica-visits__field-value">
            <TextWithDocumentLinks text={cleanLine} />
          </span>
        );
      })}
    </span>
  );
};

const getRowDate = (row: string[]): string =>
  row.join(" ").match(DATE_PATTERN)?.[1] ?? "";

const isEmptyVisitEditorText = (value: string): boolean =>
  /HH\s*:\s*MM\s+dd[./-]mm[./-]yyyy/i.test(value);

const resolveVisitTable = (
  records: ClinicaMedicalRecord[],
): { table: ClinicaVisitTable; syncedAt?: string } | null => {
  const structuredRecord = records.find(
    (record) =>
      record.recordType === "visitDetails" &&
      record.table?.rows.some((row) => Boolean(getRowDate(row))),
  );
  if (structuredRecord?.table) {
    return {
      table: {
        ...structuredRecord.table,
        rows: structuredRecord.table.rows
          .filter((row) => Boolean(getRowDate(row)))
          .map(normalizeVisitRowDocuments),
      },
      syncedAt: structuredRecord.syncedAt,
    };
  }

  const textRecord = records.find(
    (record) =>
      record.recordType === "visitDetails" &&
      record.rawText?.trim() &&
      !isEmptyVisitEditorText(record.rawText),
  );
  if (!textRecord?.rawText) return null;

  return {
    table: {
      headers: ["\u05e4\u05e8\u05d8\u05d9 \u05d1\u05d9\u05e7\u05d5\u05e8"],
      rows: [[textRecord.rawText]],
    },
    syncedAt: textRecord.syncedAt,
  };
};

const hasStructuredVisitTable = (records: ClinicaMedicalRecord[]): boolean =>
  records.some(
    (record) =>
      record.recordType === "visitDetails" &&
      record.table?.rows.some((row) => Boolean(getRowDate(row))),
  );

type DatedVisitRow = {
  date: string;
  originalIndex: number;
  row: string[];
};

type MatchedClinicaPatient = {
  client: ClinicaClient;
  pet: ClinicaClient["pets"][number];
};

type LoadedClinicaPatient = MatchedClinicaPatient & {
  visitsWereFetched?: boolean;
};

const normalizeText = (value?: string): string =>
  value?.trim().replace(/\s+/g, " ").toLocaleLowerCase("he-IL") ?? "";

const normalizeName = (value?: string): string =>
  normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳³״`.,/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizePhone = (value?: string): string => {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.startsWith("972") ? `0${digits.slice(3)}` : digits;
};

const getPetMedicalRecords = (
  client: ClinicaClient,
  pet: ClinicaClient["pets"][number],
): ClinicaMedicalRecord[] => {
  const targetName = normalizeName(pet.name);
  const rawPatientName = normalizeName(client.rawData?.original?.patient?.name);
  const legacyRecords = [
    ...(client.rawData?.original?.patient?.medicalRecords ?? []),
    ...(client.rawData?.original?.medicalRecords ?? []),
  ];
  const scopedLegacyRecords = legacyRecords.filter((record) => {
    const recordPatientName = normalizeName(record.patientName);
    if (recordPatientName) return recordPatientName === targetName;
    if (rawPatientName) return rawPatientName === targetName;
    return client.pets.length === 1;
  });

  const records = [...(pet.medicalRecords ?? []), ...scopedLegacyRecords];
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = JSON.stringify({
      patientName: normalizeName(record.patientName),
      recordType: record.recordType,
      rawText: record.rawText,
      table: record.table,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function ClinicaVisitsTable({
  externalPatientId,
  ownerPhone,
  patientName,
}: ClinicaVisitsTableProps) {
  const [state, setState] = useState<VisitsState>({ status: "idle" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reload, setReload] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedRow, setExpandedRow] = useState<DatedVisitRow | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayedLookupKeyRef = useRef("");

  useEffect(() => {
    let active = true;
    const cleanExternalPatientId = externalPatientId.trim();
    const caseSerialPrefix = getCaseSerialPrefix(cleanExternalPatientId) ??
      cleanExternalPatientId;
    const lookupKey = [
      normalizeText(cleanExternalPatientId),
      normalizeName(patientName),
      normalizePhone(ownerPhone),
    ].join("|");

    setPage(0);
    setSelectedDate("");
    setExpandedRow(null);
    if (!cleanExternalPatientId) {
      displayedLookupKeyRef.current = "";
      setState({ status: "idle" });
      return () => {
        active = false;
      };
    }

    setState((current) =>
      current.status === "ready" &&
      displayedLookupKeyRef.current === lookupKey
        ? current
        : { status: "loading" },
    );
    const normalizedFullId = normalizeText(cleanExternalPatientId);
    const normalizedPrefix = normalizeText(caseSerialPrefix);
    const normalizedPatientName = normalizeName(patientName);
    const normalizedOwnerPhone = normalizePhone(ownerPhone);

    // The master/client id can belong to several animals. Wait for the PETEC
    // case payload instead of ever selecting a Clinica pet by id alone.
    if (!normalizedPatientName) {
      return () => {
        active = false;
      };
    }

    const findMatchingPatient = (
      clients: ClinicaClient[],
    ): MatchedClinicaPatient | undefined => {
      for (const client of clients) {
        const pet = client.pets.find(
          (candidate) =>
            normalizeText(candidate.externalPatientId) === normalizedFullId &&
            normalizeName(candidate.name) === normalizedPatientName,
        );
        if (pet) return { client, pet };
      }

      // Normal PETEC cases use values such as 12345-2. Clinica keeps the
      // master/client number as 12345, so require that prefix together with
      // the pet name to avoid selecting another animal belonging to the owner.
      for (const client of clients) {
        const clientMatchesPrefix =
          normalizeText(client.externalPatientId) === normalizedPrefix;
        const pet = client.pets.find(
          (candidate) =>
            normalizeName(candidate.name) === normalizedPatientName &&
            (clientMatchesPrefix ||
              normalizeText(candidate.externalPatientId) === normalizedPrefix),
        );
        if (pet) return { client, pet };
      }

      if (normalizedOwnerPhone && normalizedPatientName) {
        for (const client of clients) {
          if (normalizePhone(client.ownerPhone) !== normalizedOwnerPhone) continue;
          const pet = client.pets.find(
            (candidate) => normalizeName(candidate.name) === normalizedPatientName,
          );
          if (pet) return { client, pet };
        }
      }

      return undefined;
    };

    const loadMatchingClient = async (): Promise<LoadedClinicaPatient | undefined> => {
      if (normalizedPatientName) {
        const prefixClient = await getClinicaClientByCasePrefix(
          caseSerialPrefix,
          patientName ?? "",
          ownerPhone,
        ).catch(() => null);
        if (prefixClient) {
          const prefixMatch = findMatchingPatient([prefixClient]);
          if (prefixMatch) return prefixMatch;
        }

        const exactClient = await getClinicaClientByExternalPatientId(
          cleanExternalPatientId,
        ).catch(() => null);
        if (exactClient) {
          const exactMatch = findMatchingPatient([exactClient]);
          if (exactMatch) return exactMatch;
        }
      }

      // No cached Clinica row matched. Only now perform the targeted live
      // lookup/scrape, once, using the master case prefix and exact pet name.
      if (!normalizedPatientName) return undefined;
      const fetchedCaseClient = await fetchClinicaVisitsForCase(
        caseSerialPrefix,
        patientName ?? "",
        ownerPhone,
      );
      const fetchedMatch = findMatchingPatient([fetchedCaseClient]);
      if (fetchedMatch) return { ...fetchedMatch, visitsWereFetched: true };
      const exactNamePet = fetchedCaseClient.pets.find(
        (pet) => normalizeName(pet.name) === normalizedPatientName,
      );
      return exactNamePet
        ? { client: fetchedCaseClient, pet: exactNamePet, visitsWereFetched: true }
        : undefined;
    };

    void loadMatchingClient()
      .then(async (match) => {
        if (!active) return;
        if (!match) {
          setState((current) =>
            current.status === "ready" &&
            displayedLookupKeyRef.current === lookupKey
              ? current
              : { status: "not-found" },
          );
          return;
        }
        const { client, pet: matchingPet } = match;
        let records = getPetMedicalRecords(client, matchingPet);
        let visitResult = resolveVisitTable(records);

        if (!hasStructuredVisitTable(records) && !match.visitsWereFetched) {
          try {
            const refreshedClient = await fetchClinicaPetVisits(client._id, matchingPet.name);
            const refreshedPet = refreshedClient.pets.find(
              (pet) => normalizeName(pet.name) === normalizeName(matchingPet.name),
            );
            records = refreshedPet
              ? getPetMedicalRecords(refreshedClient, refreshedPet)
              : records;
            visitResult = resolveVisitTable(records) ?? visitResult;
          } catch (error) {
            // A legacy raw-text visit is still useful if refreshing the
            // structured table temporarily fails.
            if (!visitResult) throw error;
          }
        }

        if (!visitResult) {
          setState((current) =>
            current.status === "ready" &&
            displayedLookupKeyRef.current === lookupKey
              ? current
              : { status: "not-found" },
          );
          return;
        }

        if (!active) return;
        displayedLookupKeyRef.current = lookupKey;
        setState({
          status: "ready",
          table: visitResult.table,
          syncedAt: visitResult.syncedAt,
        });
      })
      .catch(() => {
        if (!active) return;
        setState((current) =>
          current.status === "ready" &&
          displayedLookupKeyRef.current === lookupKey
            ? current
            : { status: "error" },
        );
      });

    return () => {
      active = false;
    };
  }, [externalPatientId, ownerPhone, patientName, reload]);

  useEffect(() => {
    if (!expandedRow) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedRow(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedRow]);

  const table = state.status === "ready" ? state.table : null;
  const syncedAt = state.status === "ready" ? state.syncedAt : undefined;
  const columnCount = useMemo(
    () => Math.max(
      table?.headers.length ?? 0,
      ...((table?.rows ?? []).map((row) => row.length)),
    ),
    [table],
  );
  const tableDocumentUrl = useMemo(() => {
    const documentUrls = Array.from(new Set(
      (table?.rows ?? [])
        .map((row) => extractVetConnectDocumentUrl(row))
        .filter((url): url is string => Boolean(url)),
    ));
    return documentUrls.length === 1 ? documentUrls[0] : undefined;
  }, [table]);
  const datedRows = useMemo<DatedVisitRow[]>(() => {
    let effectiveDate = "";
    const rows = (table?.rows ?? []).map((row, originalIndex) => {
      const rowDate = getRowDate(row);
      if (rowDate) effectiveDate = rowDate;
      return { date: effectiveDate, originalIndex, row };
    });
    const firstDate = rows.find(({ date }) => date)?.date ?? "";
    return rows.map((item) => item.date ? item : { ...item, date: firstDate });
  }, [table]);
  const availableDates = useMemo(
    () => Array.from(new Set(datedRows.map(({ date }) => date).filter(Boolean))),
    [datedRows],
  );
  const filteredRows = useMemo(
    () => selectedDate
      ? datedRows.filter(({ date }) => date === selectedDate)
      : datedRows,
    [datedRows, selectedDate],
  );
  const pageCount = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const showPagination = filteredRows.length > DEFAULT_PAGE_SIZE;

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 0), pageCount - 1));
    scrollRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };

  if (state.status === "idle") {
    return (
      <section className="clinica-visits clinica-visits--status" dir="rtl" aria-live="polite">
        <span>ממתין לפרטי התיק כדי לטעון ביקורים מקליניקה…</span>
      </section>
    );
  }

  if (state.status === "not-found") {
    return (
      <section className="clinica-visits clinica-visits--status" dir="rtl" role="status">
        <span>לא נמצאה היסטוריית ביקורים עבור המטופל בקליניקה.</span>
        <button type="button" onClick={() => setReload((value) => value + 1)}>
          נסו שוב
        </button>
      </section>
    );
  }

  if (state.status === "loading") {
    return (
      <section className="clinica-visits clinica-visits--status" dir="rtl" aria-live="polite">
        <span className="clinica-visits__loader" aria-hidden="true" />
        טוען היסטוריית ביקורים מקליניקה…
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="clinica-visits clinica-visits--status" dir="rtl" role="status">
        <span>לא ניתן לטעון כרגע את ביקורי קליניקה.</span>
        <button type="button" onClick={() => setReload((value) => value + 1)}>
          נסו שוב
        </button>
      </section>
    );
  }

  if (!table || columnCount === 0) return null;

  return (
    <section className="clinica-visits" dir="rtl" aria-labelledby="clinica-visits-title">
      <header className="clinica-visits__header">
        <div>
          <h3 id="clinica-visits-title"><FaHospital aria-hidden="true" /> ביקורים קודמים בקליניקה</h3>
          <p>המידע מוצג כפי שנקלט מטבלת הביקורים של קליניקה.</p>
        </div>
        <div className="clinica-visits__meta">
          <strong>{table.rows.length}</strong> ביקורים
          {syncedAt && (
            <span>סנכרון אחרון: {new Date(syncedAt).toLocaleDateString("he-IL")}</span>
          )}
        </div>
      </header>

      {availableDates.length > 0 && (
        <div className="clinica-visits__filters">
          <label htmlFor="clinica-visits-date">מעבר לתאריך</label>
          <select
            id="clinica-visits-date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setPage(0);
            }}
          >
            <option value="">כל התאריכים</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          {selectedDate && <span>{filteredRows.length} רשומות בתאריך שנבחר</span>}
        </div>
      )}

      <div
        ref={scrollRef}
        className="clinica-visits__scroll"
        tabIndex={0}
        role="region"
        aria-label="טבלת ביקורים קודמים; ניתן לגלול לצדדים"
      >
        <table>
          <thead>
            <tr>
              {Array.from({ length: columnCount }, (_, index) => (
                <th key={index} scope="col">{table.headers[index] ?? ""}</th>
              ))}
              <th scope="col" className="clinica-visits__action-column">פרטים</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((visitRow) => {
              const { date, originalIndex, row } = visitRow;
              const rowDocumentUrl =
                extractVetConnectDocumentUrl(row) ?? tableDocumentUrl;
              return (
              <tr key={originalIndex}>
                {Array.from({ length: columnCount }, (_, cellIndex) => (
                  <td key={cellIndex}>
                    <span className="clinica-visits__cell-content">
                      <ReadableCellText
                        documentUrl={rowDocumentUrl}
                        value={row[cellIndex] ?? ""}
                      />
                    </span>
                  </td>
                ))}
                <td className="clinica-visits__action-column">
                  <button
                    type="button"
                    className="clinica-visits__open"
                    onClick={() => setExpandedRow(visitRow)}
                    aria-label={`פתיחת פרטי ביקור ${date}`.trim()}
                  >
                    <FaEye aria-hidden="true" /> צפייה
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <footer className="clinica-visits__pagination" aria-label="דפדוף בביקורים">
          <label>
            שורות בעמוד
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div>
            <button type="button" onClick={() => changePage(page - 1)} disabled={page === 0} aria-label="העמוד הקודם">
              <FaChevronRight aria-hidden="true" /> הקודם
            </button>
            <span aria-live="polite">עמוד {page + 1} מתוך {pageCount}</span>
            <button type="button" onClick={() => changePage(page + 1)} disabled={page + 1 >= pageCount} aria-label="העמוד הבא">
              הבא <FaChevronLeft aria-hidden="true" />
            </button>
          </div>
        </footer>
      )}

      {expandedRow && (
        <div className="clinica-visit-modal" role="presentation" onMouseDown={() => setExpandedRow(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="clinica-visit-modal-title"
            className="clinica-visit-modal__content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h3 id="clinica-visit-modal-title">פרטי ביקור</h3>
                {expandedRow.date && <span>{expandedRow.date}</span>}
              </div>
              <button type="button" onClick={() => setExpandedRow(null)} aria-label="סגירת פרטי הביקור">
                <FaTimes aria-hidden="true" />
              </button>
            </header>
            <div className="clinica-visit-modal__body">
              {Array.from({ length: columnCount }, (_, index) => {
                const value = expandedRow.row[index] ?? "";
                if (!value.trim()) return null;
                return (
                  <div key={index} className="clinica-visit-modal__field">
                    <strong>{table.headers[index] || `פרט ${index + 1}`}</strong>
                    <p>
                      <ReadableCellText
                        documentUrl={
                          extractVetConnectDocumentUrl(expandedRow.row) ??
                          tableDocumentUrl
                        }
                        value={value}
                      />
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
