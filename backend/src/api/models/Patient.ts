import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { AnimalType } from "./AnimalType";
import { GenderType } from "./GenderType";
import { RaceType } from "./RaceType";
import { AnimalColor } from "./AnimalColor";
import { FoodType } from "./FoodType";
import { InsuranceType } from "./InsuranceType";

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
    nullable: false,
  })
  name!: string;

  @Column({
    name: "owner_name",
    length: 100,
    nullable: false,
  })
  ownerName!: string;

  @Column({
    name: "owner_phone_number",
    length: 300,
    nullable: false,
  })
  ownerPhoneNumber!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => AnimalType, { eager: true, nullable: false })
  @JoinColumn({ name: "animal_id", referencedColumnName: "id" })
  animalId!: AnimalType;

  @ManyToOne(() => GenderType, { eager: true, nullable: false })
  @JoinColumn({ name: "gender_id", referencedColumnName: "id" })
  genderId!: GenderType;

  @ManyToOne(() => RaceType, { eager: true, nullable: true })
  @JoinColumn({ name: "race_id", referencedColumnName: "id" })
  raceId: RaceType | null | undefined;

  @ManyToOne(() => AnimalColor, { eager: true, nullable: true })
  @JoinColumn({ name: "animal_color_id", referencedColumnName: "id" })
  animalColorId: AnimalColor | undefined;

  @ManyToOne(() => InsuranceType, { eager: true, nullable: true })
  @JoinColumn({ name: "insurance_id", referencedColumnName: "id" })
  insuranceId: InsuranceType | undefined;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy: User | undefined;

  @Column({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
  updatedBy: User | undefined;

  @ManyToOne(() => FoodType, { eager: true, nullable: true })
  @JoinColumn({ name: "food_type_id", referencedColumnName: "id" })
  foodTypeId: FoodType | undefined;

  @Column({
    type: "varchar",
    length: 300,
    nullable: true,
    select: false,
    name: "photo_name",
  })
  photoName: string | undefined;
}
