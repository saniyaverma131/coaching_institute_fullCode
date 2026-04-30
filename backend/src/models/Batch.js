import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Batch = sequelize.define('Batch', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  teacher_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  schedule_text: { type: DataTypes.STRING(255), allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
  capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
}, {
  tableName: 'batches',
  // DB may have been created without updated_at; omit writes to that column.
  // Run scripts/add-batches-updated-at.sql if you want ON UPDATE parity with other tables.
  updatedAt: false,
});

export default Batch;
