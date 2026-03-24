import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { CaseDailyDetails } from "./CaseDailyDetails";
import { CaseExaminations } from "./CaseExaminations";

@Entity()
export class CaseDailyDetailsExaminations {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CaseExaminations, { eager: true, nullable: false })
  @JoinColumn({ name: "case_examinations_id", referencedColumnName: "id" })
  caseExaminationsId!: CaseExaminations;

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
    name: "value",
    type: "text",
    nullable: true,
  })
  value: string | null | undefined;

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
