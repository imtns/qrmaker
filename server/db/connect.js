const mysql = require('mysql');
const db = require('./config');
const pool = mysql.createPool(db);

module.exports = {
    connPool(sql, val) {
        return new Promise((resolve,reject) => {
            pool.getConnection((err, conn) => {
                const q = conn.query(sql, val, (err, rows) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(rows);
                    conn.release();
                });
            });
        })
    }
};