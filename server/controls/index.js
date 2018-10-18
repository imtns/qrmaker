const sql = require('../db/command');
const moment = require('moment');
const func = require('../db/connect');
const DATE = moment(new Date).format('YYYY-MM-DD HH:mm:ss');
var crypto = require('crypto');

function cryptPwd(password) {
    var md5 = crypto.createHash('md5');
    return md5.update(password).digest('hex');
}

function formatData(rows) {
    return rows.map(row => {
        return Object.assign({}, row, {
            create_time: moment(row.create_time).format('YYYY-MM-DD HH:mm:ss'),
            update_time: moment(row.update_time).format('YYYY-MM-DD HH:mm:ss')
        });
    });
}

function resSend(res, code, msg) {
    res.send({
        code,
        msg: msg.message
    });
}
module.exports = {
    async getList(req, res) {
        const {
            pageNum,
            id,
        } = req.query;
        try {
            let rows = null;
            if(id){
                rows = await func.connPool(sql.getById, [id])
            }else{
                rows = await func.connPool(`SELECT * , (select count(*) from projects) as total FROM projects ORDER BY id limit ${pageNum*10},10`);
            }
            rows = formatData(rows);
            res.json({
                code: 200,
                msg: 'success',
                list: rows
            });
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    // 获取商品详情
    async getById(req, res) {
        const {
            id
        } = req.query;
        try {
            let rows = await func.connPool(sql.getById, [id])
            rows = formatData(rows);
            res.json({
                code: 200,
                msg: 'success',
                git: rows[0]
            });
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    async edit(req, res) {
        const {
            params
        } = req.body; // 更新
        try {
            await func.connPool(sql.update, [
                params.project_name,
                params.git_url,
                params.git_username,
                params.git_password,
                params.codetype,
                params.folder,
                DATE,
                params.id,
            ])
            resSend(res, 200, 'done')
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    async add(req, res) {
        // 新增
        const {
            params
        } = req.body; // 更新
        try {
            await func.connPool(sql.insert, [
                params.project_name,
                params.git_url,
                params.git_username,
                params.git_password,
                params.codetype,
                params.folder,
                DATE,
                DATE
            ])
            resSend(res, 200, 'done')
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    // 删除商品
    async delete(req, res) {
        let {
            params
        } = req.body;
        var ids = params.id.toString().split(',');
        try {
            await func.connPool(sql.del, [
                [ids]
            ])
            resSend(res, 200, 'done')
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    async regist(req, res) {
        const {
            username,
            password
        } = req.query;
        try {
            await func.connPool(sql.regist, [username, cryptPwd(password), DATE]);
            res.send({
                code: 200,
                msg: 'done'
            });
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    async login(req, res) {
        const {
            username,
            password
        } = req.body;
        try {
            const rows = await func.connPool(sql.login, [username, cryptPwd(password)]);
            if (rows.length > 0) {
                res.send({
                    code: 200,
                    msg: 'done',
                    user: {
                        nickname: '58'
                    }
                });
            } else {
                res.send({
                    code: 100,
                    msg: 'user not exist'
                });
            }
        } catch (err) {
            resSend(res, -100, err)
        }
    },
    async pull(req, res) {

    }
};