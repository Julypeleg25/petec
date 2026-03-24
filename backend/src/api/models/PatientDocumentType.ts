import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class PatientDocumentType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "varchar",
    name: "name",
    nullable: true,
  })
  name!: string;
}
