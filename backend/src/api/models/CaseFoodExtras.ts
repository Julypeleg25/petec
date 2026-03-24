import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Case } from "./Case";
import { FoodExtraType } from "./FoodExtraType";

@Entity()
export class CaseFoodExtras {
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

  @ManyToOne(() => FoodExtraType, { eager: true, nullable: true })
  @JoinColumn({ name: "food_extra_id", referencedColumnName: "id" })
  foodExtraId!: FoodExtraType;
}
