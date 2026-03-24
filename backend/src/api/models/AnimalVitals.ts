import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AnimalType } from "./AnimalType";

@Entity()
export class AnimalVitals {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => AnimalType, { eager: true, nullable: false })
  @JoinColumn({ name: "animal_id", referencedColumnName: "id" })
  animalId!: AnimalType;

  @Column({
    name: "vitals_type",
    type: "text",
    nullable: false,
  })
  vitalsType!: "T" | "P" | "R";

  @Column({
    name: "range_max",
    type: "float4",
    nullable: true,
  })
  rangeMax: number | undefined;

  @Column({
    name: "range_min",
    type: "float4",
    nullable: true,
  })
  rangeMin: number | undefined;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;
}
