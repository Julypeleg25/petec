import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { UserPrivilege } from "./UserPrivilege";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 150, nullable: false })
  name!: string;

  @Column({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | undefined;

  @ManyToMany(() => UserPrivilege)
  @JoinTable({
    name: "user_role_user_privilege",
    joinColumn: { name: "role_id" },
    inverseJoinColumn: { name: "privilege_id" },
  })
  privileges: UserPrivilege[] | undefined;
}
