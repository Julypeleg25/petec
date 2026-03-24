import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Patient } from "./Patient";
import { CaseDailyDetails } from "./CaseDailyDetails";
@Entity()
export class Case {
  @PrimaryColumn({ type: "varchar", length: 255 })
  id!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy: User | undefined;

  @ManyToOne(() => Patient, { eager: true, nullable: false })
  @JoinColumn({ name: "patient_id", referencedColumnName: "id" })
  patientId!: Patient;

  @Column({
    name: "release_date",
    type: "timestamptz",
    nullable: true,
  })
  releaseDate: Date | undefined;

  @Column({
    type: "int",
    name: "age_years",
    nullable: true,
  })
  ageYears: number | null | undefined;

  @Column({
    type: "int",
    name: "age_months",
    nullable: true,
  })
  ageMonths: number | null | undefined;

  @Column({
    type: "float4",
    name: "weight_kg",
    nullable: true,
  })
  weightKg: number | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "doctor_id", referencedColumnName: "id" })
  doctorId: User | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "nurse_id", referencedColumnName: "id" })
  nurseId: User | undefined;

  @Column({
    name: "referring_doctor",
    type: "text",
    nullable: true,
  })
  referringDoctor: string | null = null;

  @Column({
    name: "hospitalization_reason",
    type: "text",
    nullable: true,
  })
  hospitalizationReason: string | null = null;

  @Column({
    name: "allergic_comments",
    type: "text",
    nullable: true,
  })
  allergicComments: string | null = null;

  @Column({
    type: "boolean",
    name: "is_allergic",
    nullable: true,
  })
  isAllergic: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_escape_potential",
    nullable: true,
  })
  isEscapePotential: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_npo",
    nullable: true,
  })
  isNPO: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_risk_anesthesia",
    nullable: true,
  })
  isRiskAnesthesia: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_heart_murmur",
    nullable: true,
  })
  isHeartMurmur: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_amb",
    nullable: true,
  })
  isAMB: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_aggressive",
    nullable: true,
  })
  isAggressive: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_convenia",
    nullable: true,
  })
  isConvenia: boolean | undefined;

  @Column({
    type: "boolean",
    name: "is_cerenia",
    nullable: true,
  })
  isCerenia: boolean | undefined;

  @Column({
    name: "catheter_date",
    type: "timestamptz",
    nullable: true,
  })
  catheterDate: Date | null | undefined;

  @Column({
    name: "procedure_date",
    type: "timestamptz",
    nullable: true,
  })
  procedureDate: Date | null | undefined;

  @Column({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date | undefined;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
  updatedBy: User | undefined;

  @Column({
    type: "boolean",
    name: "is_procedure",
    nullable: true,
  })
  isProcedure: boolean | undefined;

  @OneToMany(() => CaseDailyDetails, (c) => c.caseId, { cascade: ["insert"] })
  caseDailyDetails: CaseDailyDetails[] | undefined;

  @Column({
    name: "next_inspection_date",
    type: "timestamptz",
    nullable: true,
  })
  nextInspectionDate: Date | undefined;

  @Column({
    name: "stitches_removal_date",
    type: "timestamptz",
    nullable: true,
  })
  stitchesRemovalDate: Date | undefined;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: "released_by", referencedColumnName: "id" })
  releasedBy: User | undefined;

  @Column({
    type: "text",
    nullable: true,
  })
  comments: string | null = null;

  @Column({
    type: "boolean",
    name: "is_archived",
    nullable: true,
    default: false,
  })
  isArchived: boolean | undefined;

  @Column({
    type: "text",
    name: "blood_test_link",
    nullable: true,
  })
  bloodTestLink: string | null = null;

  @Column({
    name: "daily_plan_comments",
    type: "text",
    nullable: true,
  })
  dailyPlanComments: string | null = null;

  @Column({
    name: "daily_plan_comments_created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  dailyPlanCommentsCreatedAt: Date | undefined;

  @Column({
    type: "boolean",
    name: "is_deleted",
    default: false,
  })
  isDeleted: boolean | undefined;
}
