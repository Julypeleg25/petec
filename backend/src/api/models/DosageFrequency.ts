import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class DosageFrequency {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
    unique: true,
    nullable: false,
  })
  name!: string;

  @Column({
    length: 100,
    nullable: false,
  })
  description!: string;

  @Column({
    length: 100,
    nullable: true,
    name: "description_per_hour",
  })
  descriptionPerHour!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;
}
