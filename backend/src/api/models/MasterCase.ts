import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class MasterCase {
  @PrimaryColumn()
  @PrimaryColumn({ type: "varchar", length: 255 })
  id!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;
}
