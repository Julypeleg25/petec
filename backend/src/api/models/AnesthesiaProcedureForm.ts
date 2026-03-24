import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Case } from "./Case";

@Entity()
export class AnesthesiaProcedureForm {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, { eager: true, nullable: false })
  @JoinColumn({ name: "case_id", referencedColumnName: "id" })
  caseId!: Case;

  @Column({
    name: "owner_name",
    nullable: false,
  })
  ownerName!: string;

  @Column({
    nullable: false,
  })
  name!: string;

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

  @Column({
    type: "boolean",
    name: "is_fast_since_midnight",
    nullable: true,
    default: false,
  })
  isFastSinceMidnight: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_distortion_history",
    nullable: true,
    default: false,
  })
  isDistortionHistory: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_medications_sensitive",
    nullable: true,
    default: false,
  })
  isMedicationsSensitive: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_need_to_mark_ear",
    nullable: true,
    default: false,
  })
  isNeedToMarkEar: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_sterilization",
    nullable: true,
    default: false,
  })
  isSterilization: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_price_includes_release_medications",
    nullable: true,
    default: false,
  })
  isPriceIncludesReleaseMedications: boolean | undefined | null;

  @Column({
    type: "float4",
    name: "price_estimate",
    nullable: true,
  })
  priceEstimate: number | undefined | null;

  @Column({
    name: "planned_procedure",
    nullable: false,
  })
  plannedProcedure!: string;

  @Column({
    type: "timestamptz",
    nullable: true,
  })
  date: Date | null | undefined;

  @Column({
    type: "varchar",
    nullable: true,
    select: false,
    name: "signature",
  })
  signature: string | undefined;

  @Column({
    type: "varchar",
    nullable: true,
    name: "general_comments",
  })
  generalComments: string | undefined;

  @Column({
    type: "varchar",
    nullable: true,
    name: "distortion_comments",
  })
  distortionComments: string | undefined;

  @Column({
    type: "varchar",
    nullable: true,
    name: "medications_sensitive_comments",
  })
  medicationsSensitiveComments: string | undefined;
}
