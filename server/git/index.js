const fs = require('fs');

const {
    o
} = require('../utils/config');

const {
    cloneToLocal,
    pull,
    getAllBranches
} = require('./control');


const {
    makingQR,
    readModuleFile
} = require('../utils/utils');

/**
 * 
 * 
 * 
 * 获取最新git代码
 * 
 */
module.exports = {
    //获取所有分支
    async getBraches(req, res) {
        ({
            project_name: o.projectName,
            git_url: o.gitURL,
        } = req.body);
        o.localPath = o.folder + o.projectName + '/master';
        if (!fs.existsSync(o.localPath)) {
            try {
                await cloneToLocal('master');
            } catch (err) {
                res.status(500).json({
                    msg: err,
                    data: []
                });
                return;
            }
        }
        try {
            const arr = await getAllBranches();
            res.status(200).json({
                msg: "OK",
                data: arr
            });
        } catch (err) {
            res.status(500).json({
                msg: err,
                data: []
            });
        }
    },
    async cloneGit(req, res) {
        try {
            ({
                project_name: o.projectName,
                git_url: o.gitURL,
            } = req.body);
            await cloneToLocal('master');
            res.status(200).json({
                code: 200,
                msg: 'Done',
            });
        } catch (err) {
            res.status(500).json({
                msg: err,
                data: []
            });
        }
    },
    async fetchState(req, res) {
        res.json({
            code: 200,
            msg: o.currentState
        });
    },
    /**
     * 生成二维码
     */
    async preview(req, res) {
        try {
            ({
                git_url: o.gitURL,
                project_name: o.projectName,
                branch: o.branch,
                isWepy: o.isWepy,
                folder: o.folder,
                needModules:o.needModules
            } = req.body);
            o.isWepy = (o.isWepy === '是')

            console.log('clone to local...');
            await cloneToLocal(o.branch);
            console.log('clone done!');

            const qrPath = o.qrcodePath  + o.projectName + "/" + o.branch;
            const qrFilePath = qrPath + "/qrcode.txt";

            //每次清空二维码，否则会存在过期的情况
            if (!fs.existsSync(o.qrcodePath + o.projectName)) {
                fs.mkdirSync(o.qrcodePath + o.projectName);
            }
            if (!fs.existsSync(qrPath)) {
                fs.mkdirSync(qrPath);
            }
            fs.writeFileSync(qrFilePath, "")

            await pull();
            try {
                await makingQR();
            } catch (err) {
                o.currentState = "";
                let message = "";
                if (err.indexOf('登录') > -1 && err.indexOf('开发者') == -1 ) {
                    message = '请联系管理员重新登录开发者工具'
                } 
                // else if (err.indexOf('相同') > -1) {
                //     message = '开发者工具已存在相同项目名称, 请修改名称后生成'
                // } 
                else {
                    message = err;
                }
                res.json({
                    code: 100,
                    msg: message,
                });
                return;
            }

            //最终预览二维码
            const base64 = await readModuleFile(qrFilePath)
            res.json({
                code: 200,
                msg: 'success',
                base64
            });

            o.currentState = '';
            console.log('QR finished!!!');
        } catch (err) {
            res.json({
                code: -100,
                msg: err.message,
            });
            o.currentState = '';
            console.log(err.message);
        }
    },

}