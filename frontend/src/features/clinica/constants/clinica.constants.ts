export const CLINICA_ROWS_PER_PAGE = 10;
export const CLINICA_CLIENTS_DEBOUNCE_MS = 300;
export const CLINICA_SYNC_STATUS_POLL_MS = 5000;
export const CLINICA_PREFILL_SEARCH_DEBOUNCE_MS = 300;
export const CLINICA_PREFILL_SEARCH_LIMIT = 8;

export const CLINICA_COLORS = {
  primary: "#B65AD8",
  primarySoft: "rgba(177, 89, 205, 0.08)",
  primaryFaint: "rgba(177, 89, 205, 0.04)",
  border: "rgba(177, 89, 205, 0.28)",
  shadow: "0 2px 8px rgba(177, 89, 205, 0.28)",
} as const;

export const CLINICA_ROUTES = {
  newPatientSource: "clinica",
} as const;

export const CLINICA_TEXTS = {
  pageTitle: "לקוחות מקליניקה אונליין",
  searchPlaceholder: "חיפוש לפי מספר תיק, שם בעלים, טלפון או שם חיה",
  manualSync: "סנכרון ידני",
  syncing: "מסנכרן...",
  clientsTitle: "כל הלקוחות",
  clientsCount: (total: number) => `${total} לקוחות`,
  syncSuccess: (created: number, updated: number) =>
    `הסנכרון הסתיים בהצלחה: ${created} נוצרו, ${updated} עודכנו`,
  syncError: "הסנכרון נכשל",
  loadClientsError: "לא הצלחנו לטעון את הלקוחות מהקליניקה",
  createCase: "פתיחת תיק",
  openingCase: "טוען פרטים...",
  hydratePatientError: "לא הצלחנו לטעון את פרטי החיה מהקליניקה. נסו שוב.",
  noClients: "לא נמצאו לקוחות",
  prefillSearchTitle: "חיפוש מקליניקה אונליין",
  prefillSearchDescription: "אפשר לחפש לפי מספר תיק, שם חיה או שם בעלים ולמלא את הטופס מהמידע שסונכרן.",
  prefillSearchPlaceholder: "חיפוש לפי מספר תיק / שם חיה / שם בעלים",
  prefillSearchLoading: "מחפש...",
  prefillSearchEmpty: "לא נמצאו התאמות",
  prefillSearchError: "לא הצלחנו לחפש בלקוחות הקליניקה",
  prefillHydrating: "טוען את פרטי החיה מהקליניקה...",
  prefillHydrationError: "לא הצלחנו לטעון את פרטי החיה שנבחרה. נסו שוב.",
  prefillSelectAction: "מילוי פרטים",
  prefillClearAction: "נקה",
  choosePetTitle: "בחירת חיה לפתיחת תיק",
  choosePetDescription: "ללקוח הזה יש כמה חיות. בחרי עבור מי לפתוח תיק.",
  cancel: "ביטול",
  prefillCommentsTitle: "מידע שיובא מקליניקה אונליין",
  prefillMedicalRecordsTitle: "רשומות רפואיות מהקליניקה",
  prefillCommentLabels: {
    clinicaCaseId: "מספר תיק קליניקה",
    ownerName: "שם בעלים",
    ownerPhone: "טלפון בעלים",
    relatedPets: "חיות משויכות",
  },
  paginationRows: (from: number, to: number, count: number) =>
    `${from}-${to} מתוך ${count}`,
  table: {
    clinicaCaseId: "מספר תיק קליניקה",
    ownerName: "שם בעלים",
    phone: "טלפון",
    pets: "חיות",
    lastSync: "סנכרון אחרון",
    action: "פעולה",
  },
} as const;
