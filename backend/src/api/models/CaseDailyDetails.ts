import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Case } from "./Case";
import { UrineType } from "./UrineType";
import { FecesType } from "./FecesType";

@Entity()
export class CaseDailyDetails {
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

  @Column({
    name: "date",
    type: "date",
    nullable: false,
  })
  date!: Date;

  @Column({
    name: "time",
    type: "time",
    nullable: false,
  })
  time!: string;

  @Column({
    type: "float4",
    nullable: true,
  })
  temp: number | undefined | null;

  @Column({
    type: "boolean",
    name: "temp_is_required",
    nullable: true,
    default: false,
  })
  tempIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "temp_is_editable",
    nullable: true,
    default: true,
  })
  tempIsEditable: boolean | undefined | null;

  @Column({
    type: "float4",
    nullable: true,
  })
  pulse: number | undefined | null;

  @Column({
    type: "boolean",
    name: "pulse_is_required",
    nullable: true,
    default: false,
  })
  pulseIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "pulse_is_editable",
    nullable: true,
    default: true,
  })
  pulseIsEditable: boolean | undefined | null;

  @Column({
    type: "float4",
    nullable: true,
  })
  respiration: number | undefined | null;

  @Column({
    type: "boolean",
    name: "respiration_is_required",
    nullable: true,
    default: false,
  })
  respirationIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "respiration_is_editable",
    nullable: true,
    default: true,
  })
  respirationIsEditable: boolean | undefined | null;

  @ManyToOne(() => UrineType, { eager: true, nullable: true })
  @JoinColumn({ name: "urine_type_id", referencedColumnName: "id" })
  urineTypeId: UrineType | undefined | null;

  @Column({
    type: "varchar",
    name: "urine_comments",
    nullable: true,
  })
  urineComments: string | undefined | null;

  @Column({
    type: "boolean",
    name: "urine_is_required",
    nullable: true,
    default: false,
  })
  urineIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "urine_is_editable",
    nullable: true,
    default: true,
  })
  urineIsEditable: boolean | undefined | null;

  @ManyToOne(() => FecesType, { eager: true, nullable: true })
  @JoinColumn({ name: "feces_type_id", referencedColumnName: "id" })
  fecesTypeId: FecesType | undefined | null;

  @Column({
    type: "varchar",
    name: "feces_comments",
    nullable: true,
  })
  fecesComments: string | undefined | null;

  @Column({
    type: "boolean",
    name: "feces_is_required",
    nullable: true,
    default: false,
  })
  fecesIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "feces_is_editable",
    nullable: true,
    default: true,
  })
  fecesIsEditable: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_box_clean",
    nullable: true,
  })
  isBoxClean: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_box_clean_is_required",
    nullable: true,
    default: false,
  })
  isBoxCleanIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_box_clean_is_editable",
    nullable: true,
    default: true,
  })
  isBoxCleanIsEditable: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_release",
    nullable: true,
  })
  isRelease: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_release_is_required",
    nullable: true,
    default: false,
  })
  isReleaseIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_release_is_editable",
    nullable: true,
    default: true,
  })
  isReleaseIsEditable: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_walk_trip",
    nullable: true,
  })
  isWalkTrip: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_walk_trip_is_required",
    nullable: true,
    default: false,
  })
  isWalkTripIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_walk_trip_is_editable",
    nullable: true,
    default: true,
  })
  isWalkTripIsEditable: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "is_puke",
    nullable: true,
  })
  isPuke: boolean | undefined | null;

  @Column({
    type: "varchar",
    name: "puke_comments",
    nullable: true,
  })
  pukeComments: string | undefined | null;

  @Column({
    type: "boolean",
    name: "puke_is_required",
    nullable: true,
    default: false,
  })
  pukeIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "puke_is_editable",
    nullable: true,
    default: true,
  })
  pukeIsEditable: boolean | undefined | null;

  @Column({
    type: "float4",
    nullable: true,
  })
  weigh: number | undefined | null;

  @Column({
    type: "boolean",
    name: "weigh_is_required",
    nullable: true,
    default: false,
  })
  weighIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "weigh_is_editable",
    nullable: true,
    default: true,
  })
  weighIsEditable: boolean | undefined | null;

  @Column({
    type: "varchar",
    name: "food_and_water",
    nullable: true,
  })
  foodAndWater: string | undefined | null;

  @Column({
    type: "boolean",
    name: "food_and_water_is_required",
    nullable: true,
    default: false,
  })
  foodAndWaterIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "food_and_water_is_editable",
    nullable: true,
    default: true,
  })
  foodAndWaterIsEditable: boolean | undefined | null;

  @Column({
    type: "varchar",
    name: "comments",
    nullable: true,
  })
  comments: string | undefined | null;

  @Column({
    type: "boolean",
    name: "comments_is_required",
    nullable: true,
    default: false,
  })
  commentsIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "comments_is_editable",
    nullable: true,
    default: true,
  })
  commentsIsEditable: boolean | undefined | null;

  @Column({
    type: "varchar",
    name: "owner_update",
    nullable: true,
  })
  ownerUpdate: string | undefined | null;

  @Column({
    type: "boolean",
    name: "owner_update_is_required",
    nullable: true,
    default: false,
  })
  ownerUpdateIsRequired: boolean | undefined | null;

  @Column({
    type: "boolean",
    name: "owner_update_is_editable",
    nullable: true,
    default: true,
  })
  ownerUpdateIsEditable: boolean | undefined | null;
}
