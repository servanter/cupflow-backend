import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "101.96.207.88",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "HONGyan8158",
  database: process.env.DB_NAME || "cupflow",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

// 通用查询方法
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// 通用执行方法（INSERT/UPDATE/DELETE）
export async function execute(sql: string, params?: any[]) {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
