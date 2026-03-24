import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ExaminationType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
    unique: true,
    nullable: false,
  })
  name!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;
}
