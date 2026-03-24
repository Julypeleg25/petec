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
export class CaseMedicines {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, { eager: true, nullable: false })
  @JoinColumn({ name: "case_id", referencedColumnName: "id" })
  caseId!: Case;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy: User | undefined;

  @Column({
    name: "updated_at",
    type: "timestamptz",
    nullable: true,
  })
  updatedAt: Date | undefined;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
  updatedBy: User | undefined;

  @ManyToOne(() => Medicine, { eager: true, nullable: true })
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

  @Column({
    type: "boolean",
    name: "is_medicine",
    nullable: false,
  })
  isMedicine!: boolean;
}
