import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MedicineCategory } from "./MedicineCategory";
import { MeasureUnitTypes } from "./MeasureUnitTypes";
import { RouteOfAdministration } from "./RouteOfAdministration";
import { DosageFrequency } from "./DosageFrequency";

@Entity()
export class Medicine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
    unique: true,
    nullable: false,
  })
  name!: string;

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
    name: "total_dose",
    type: "float4",
    nullable: true,
  })
  totalDose: number | undefined;

  @ManyToOne(() => MeasureUnitTypes, { eager: true, nullable: true })
  @JoinColumn({ name: "measure_unit_id", referencedColumnName: "id" })
  unit!: MeasureUnitTypes;

  @ManyToOne(() => MedicineCategory, { eager: true, nullable: true })
  @JoinColumn({ name: "category_id", referencedColumnName: "id" })
  category: MedicineCategory | undefined;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @Column({
    type: "text",
    nullable: true,
  })
  comments: string | null = null;

  @ManyToOne(() => RouteOfAdministration, { eager: true, nullable: true })
  @JoinColumn({
    name: "route_of_administration_id",
    referencedColumnName: "id",
  })
  routeOfAdministration: RouteOfAdministration | undefined;

  @ManyToOne(() => DosageFrequency, { eager: true, nullable: true })
  @JoinColumn({ name: "dosage_frequency_id", referencedColumnName: "id" })
  dosageFrequency: DosageFrequency | undefined;
}
