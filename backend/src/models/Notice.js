import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notice = sequelize.define(
  'Notice',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    author_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'notices',
    // Table has created_at only (no updated_at) — matches common MySQL schema.
    updatedAt: false,
  }
);

export default Notice;
