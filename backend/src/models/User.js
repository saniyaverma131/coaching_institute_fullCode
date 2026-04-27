import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: true },
  },
  {
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password_hash'] } },
  }
);

export default User;
