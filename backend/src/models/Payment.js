import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  invoice_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  payment_method: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'online' },
  receipt_number: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  paid_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

export default Payment;
