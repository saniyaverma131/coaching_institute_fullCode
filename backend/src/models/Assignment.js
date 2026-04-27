import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Assignment = sequelize.define('Assignment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  due_date: { type: DataTypes.DATEONLY, allowNull: true },
});

export default Assignment;
