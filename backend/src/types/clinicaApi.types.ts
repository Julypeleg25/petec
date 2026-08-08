export type RegPersonal = {
  recordID: number;
  UserID: number | string;
  FirstName: string;
  LastName: string;
  CellPhone: string;
  Phone: string;
  Address: string;
  Email: string;
  NumCust?: number;
  LastVisit?: string;
  PetsList?: string;
};

export type RegPet = {
  PetID?: number;
  recordID?: number;
  ID?: number;
  Name: string;
  Type?: string;
  Breed?: string;
  Sex?: number;
  Weight?: number;
  DateBirth?: string;
  NotActive?: number;
  Color?: string;
  ElectNumber?: string;
  Neut?: number;
  InsuranceName?: string;
  InsCust?: number;
  JumpNote?: string;
  [key: string]: unknown;
};

export type RegPetSession = {
  BranchName?: string;
  SessionID?: number;
  PetID?: number;
  PetName?: string;
  Date?: string;
  TherapistName?: string;
  Reason?: string;
  Finds?: string;
  Notes?: string;
  SessionNotes?: string;
  Anamneza?: string;
  Weight?: number;
  Temprature?: number;
  Pulse?: string;
  Breath?: string;
  RemDescription?: string;
  Instructions?: string;
  Items?: Array<{
    FieldName?: string;
    Notes?: string;
    Price?: number;
    Total?: number;
  }> | null;
};

export type RegVaccine = {
  Name?: string;
  Date?: string;
  NextDate?: string;
  TherapistName?: string;
  Notes?: string;
};

export type RegDocument = {
  FilePath?: string;
  DocPath?: string;
  DocNotes?: string;
  DateCreated?: string;
};

export type RegPetGeneral = {
  BranchName?: string;
  Date?: string;
  Session?: RegPetSession | null;
  Vaccine?: RegVaccine | null;
  Pres?: Record<string, unknown> | null;
  Labs?: Record<string, unknown> | null;
  TestNames?: Record<string, unknown> | null;
  Docs?: RegDocument | null;
  Order?: Record<string, unknown> | null;
};

