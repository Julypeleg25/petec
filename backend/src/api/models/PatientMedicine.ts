import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Medicine } from "./Medicine";
import { DosageFrequency } from "./DosageFrequency";
import { RouteOfAdministration } from "./RouteOfAdministration";
import { Case } from "./Case";

@Entity()
export class PatientMedicine {
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

  @ManyToOne(() => Medicine, { nullable: false })
  @JoinColumn({ name: "medicine_id", referencedColumnName: "id" })
  medicineId!: Medicine;

  @ManyToOne(() => DosageFrequency, { eager: true, nullable: true })
  @JoinColumn({ name: "frequency_id", referencedColumnName: "id" })
  frequencyId!: DosageFrequency;

  @Column({
    type: "float4",
    nullable: true,
    name: "dose_amount",
  })
  doseAmount!: number;

  @ManyToOne(() => RouteOfAdministration, { eager: true, nullable: true })
  @JoinColumn({
    name: "route_of_administration_id",
    referencedColumnName: "id",
  })
  routeOfAdministrationId!: RouteOfAdministration;
}
