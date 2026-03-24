import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Case } from "./Case";
import { PatientDocumentType } from "./PatientDocumentType";

@Entity()
export class PatientDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: "case_id", referencedColumnName: "id" })
  caseId!: Case;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy: User | undefined;

  @ManyToOne(() => PatientDocumentType, { nullable: false })
  @JoinColumn({ name: "patient_document_type", referencedColumnName: "id" })
  patientDocumentType!: PatientDocumentType;

  @Column({
    type: "varchar",
    name: "document_name",
    nullable: true,
  })
  documentName!: string;
}
