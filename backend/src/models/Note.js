import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Note = sequelize.define(
  'Note',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    uploaded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(500), allowNull: false },
  },
  {
    tableName: 'notes',
    // Table has created_at only (no updated_at).
    updatedAt: false,
  }
);

export default Note;
