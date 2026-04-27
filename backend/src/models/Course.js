import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define('Course', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  duration_text: { type: DataTypes.STRING(120), allowNull: true },
  fee_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
});

export default Course;
