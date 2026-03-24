import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserRole } from "./UserRole";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 30,
  })
  username!: string;

  @Column({
    length: 150,
  })
  password!: string;

  @Column({
    length: 150,
  })
  email!: string;

  @Column({
    name: "first_name",
    length: 30,
  })
  firstName!: string;

  @Column({
    name: "last_name",
    length: 30,
  })
  lastName!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdBy: User | undefined;

  @Column({
    name: "updated_at",
    type: "timestamptz",
    nullable: true,
  })
  updatedAt: Date | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by", referencedColumnName: "id" })
  updatedBy: User | undefined;

  @ManyToOne(() => UserRole, { eager: true, nullable: false })
  @JoinColumn({ name: "role_id", referencedColumnName: "id" })
  userRole!: UserRole;

  @Column({
    type: "varchar",
    name: "refresh_token",
    length: 500,
    nullable: true,
  })
  refreshToken: string | null = null;

  @Column({
    name: "is_deleted",
    type: "boolean",
    default: false,
  })
  isDeleted: boolean | undefined;
}
