import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define(
  'Attendance',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    batch_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    class_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late'),
      allowNull: false,
      defaultValue: 'absent',
    },
    recorded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: 'attendances' }
);

export default Attendance;
