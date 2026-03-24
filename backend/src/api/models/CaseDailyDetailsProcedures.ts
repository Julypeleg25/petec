import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { CaseDailyDetails } from "./CaseDailyDetails";
import { CaseProcedures } from "./CaseProcedures";

@Entity()
export class CaseDailyDetailsProcedures {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CaseProcedures, { eager: true, nullable: false })
  @JoinColumn({ name: "case_procedures_id", referencedColumnName: "id" })
  caseProceduresId!: CaseProcedures;

  @ManyToOne(() => CaseDailyDetails, { eager: true, nullable: false })
  @JoinColumn({ name: "case_daily_details_id", referencedColumnName: "id" })
  caseDailyDetailsId!: CaseDailyDetails;

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
    name: "is_given",
    nullable: false,
    default: false,
  })
  isGiven!: boolean;

  @Column({
    type: "boolean",
    name: "is_required",
    nullable: false,
    default: false,
  })
  isRequired!: boolean;

  @Column({
    type: "boolean",
    name: "is_editable",
    nullable: false,
    default: true,
  })
  isEditable!: boolean;
}
