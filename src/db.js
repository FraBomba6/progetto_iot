const { Pool } = require('pg');
const config = require('./config');
const pool = new Pool(config.db);

async function log(params) {
    let query = 'INSERT INTO PUBLIC.messages (id, sequence, msg) VALUES ($1, $2, $3)'
    return await pool.query(query, params)
}

module.exports = {
    log
}