import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Mark = sequelize.define(
  'Mark',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    exam_title: { type: DataTypes.STRING(120), allowNull: false },
    score: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    max_score: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 100 },
    recorded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: 'marks' }
);

export default Mark;
