import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AnimalType } from "./AnimalType";

@Entity()
export class RaceType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => AnimalType, { eager: true, nullable: false })
  @JoinColumn({ name: "animal_id", referencedColumnName: "id" })
  animalType!: AnimalType;
}
