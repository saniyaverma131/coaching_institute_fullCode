import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Certificate = sequelize.define(
  'Certificate',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
    issued_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'certificates',
    // Table has created_at only (no updated_at).
    updatedAt: false,
  }
);

export default Certificate;
