import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Case } from "./Case";
import { ExaminationType } from "./ExaminationType";

@Entity()
export class CaseExaminations {
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

  @ManyToOne(() => ExaminationType, { eager: true, nullable: true })
  @JoinColumn({ name: "examination_id", referencedColumnName: "id" })
  examinationId!: ExaminationType;
}
