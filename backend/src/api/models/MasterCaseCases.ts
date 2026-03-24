import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";
import { MasterCase } from "./MasterCase";

@Entity()
export class MasterCaseCases {
  @PrimaryColumn({ name: "master_case_id" })
  masterCaseId!: string;

  @PrimaryColumn({ name: "case_id" })
  caseId!: string;

  @ManyToOne(() => MasterCase, { nullable: false })
  @JoinColumn({ name: "master_case_id", referencedColumnName: "id" })
  masterCase!: MasterCase;

  @ManyToOne(() => Case, { nullable: false })
  @JoinColumn({ name: "case_id", referencedColumnName: "id" })
  case!: Case;
}
