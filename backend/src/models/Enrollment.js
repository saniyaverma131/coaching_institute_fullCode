import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Enrollment = sequelize.define(
  'Enrollment',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    batch_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: 'enrollments' }
);

export default Enrollment;
