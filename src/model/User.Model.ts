import { Table, Model, Column, DataType, Default, ForeignKey, BelongsTo, HasMany, Unique, HasOne } from 'sequelize-typescript';
import { AuthCode } from './AuthCode.Model';
import { Avatar } from './Avatar.Model';
import { Order } from './Order.model';

@Table({
    tableName: 'user',
    modelName: 'user',
    timestamps: true,
})

export class User extends Model {
    @Unique
    @Column({
        type: DataType.STRING
    })
    email: string;

    @Column({
        type: DataType.STRING
    })
    userName: string;

    @Column({
        type: DataType.STRING
    })
    nickName: string;

    @Column({
        type: DataType.DATE
    })
    birthDate: Date

    @Unique
    @Column({
        type: DataType.STRING
    })
    phoneNumber: string;

    @Column({
        type: DataType.STRING
    })
    password: string

    @Default(1)
    @ForeignKey(() => AuthCode)
    @Column({
        type: DataType.INTEGER
    })
    auth: number;

    @BelongsTo(() => AuthCode, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        foreignKey: 'auth',
        targetKey: 'id'
    })
    authcode: AuthCode;

    @HasOne(() => Avatar, {
        sourceKey: "email",
        foreignKey: "email"
    })
    avatar: Avatar

    @Default(0)
    @Column({
        type: DataType.INTEGER,
    })
    point: number;

    @HasMany(() => Order, {
        sourceKey: 'email',
        foreignKey: 'email'
    })
    orders: Order[];
}