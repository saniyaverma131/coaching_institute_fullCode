import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue'),
    allowNull: false,
    defaultValue: 'pending',
  },
  due_date: { type: DataTypes.DATEONLY, allowNull: true },
});

export default Invoice;
