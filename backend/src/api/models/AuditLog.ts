import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Patient } from "./Patient";
import { Case } from "./Case";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "subject",
    length: 150,
  })
  subject!: string;

  @Column({
    name: "description",
  })
  description!: string;

  @ManyToOne(() => Patient, { eager: true, nullable: true })
  @JoinColumn({ name: "patient_id", referencedColumnName: "id" })
  patientId: Patient | undefined;

  @ManyToOne(() => Case, { eager: true, nullable: true })
  @JoinColumn({ name: "case_id", referencedColumnName: "id" })
  caseId: Case | undefined;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date | undefined;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy!: User | undefined;
}
