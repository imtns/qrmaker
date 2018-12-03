const util = require('util');
const fs = require('fs');
const processMap = {};
const processExec = util.promisify(require('child_process').exec);
let {
    o
} = require('./config');

module.exports = {
    /**
     * 执行控制台命令生成二维码
     * 采用微信cli控制台命令
     * 文档地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
     * 注:执行命令需要开启微信web开发者工具
     */
    async makingQR() {
        return new Promise(async function (resolve, reject) {
            console.log('making QRCode...');
            // /*采用命令行方式运行接口 */
            const dist = `${o.localPath}${o.isWepy?'/dist':`/${o.folder}`}`;
            o.currentState = 'Making QR...'
            try {
                const result = await exec(`cli -p ${dist} --preview-qr-output base64@${o.qrcodePath}${o.projectName}/${o.branch}/qrcode.txt`)
                console.log(result);
            } catch (e) {
                console.log(e);
                reject(e);
            }
            resolve();
        })
    },
    //读取文件
    async readModuleFile(path) {
        return new Promise(async (resolve, reject) => {
            const filename = require.resolve(path);
            fs.readFile(filename, 'utf8', function (err, data) {
                if (err) {
                    reject(err)
                }
                resolve(data);
            });
        })
    },
    async startBuildProcess() {
        // const configName = '/project.config.json';
        // const configTargetPath = o.localPath + '/dist' + configName;
        // const configResoucePath = o.localPath + configName;
        // await configEdit(configResoucePath);
        // //将project.config.json拷贝到dist目录下，生成二维码需要此文件
        // try {
        //     await copyFile(configResoucePath, configTargetPath);
        //     resolve();
        // } catch (err) {
        //     console.log(err);
        //     reject(err);
        //     return;
        // }
        // return;
        return new Promise(async (resolve, reject) => {
            try {
                if (processMap[o.localPath]) {
                    setTimeout(async () => {
                        await configCopy();
                        resolve();
                    }, 3000);
                    return;
                } else {
                    //执行run build 生成dist目录
                    try {
                        o.currentState = 'Installing...(第一次加载较慢)';
                        await exec(`cd /d "${o.localPath}" && npm install`);
                    } catch (error) {
                        reject(error);
                        return;
                    }
                }
                o.currentState = 'Building...';
                try {
                    await cmdRun(`cd /d "${o.localPath}" && npm run gemini`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
                processMap[o.localPath] = true;
            } catch (err) {
                reject(err);
            }
        })
    }
}

// async function replaceFileString(path) {
//     return await new Promise(function (resolve, reject) {
//         fs.readFile(path, 'utf8', function (err, data) {
//             if (err) {
//                 return reject(err);
//             }
//             var result = data.replace('./dist', '');
//             fs.writeFile(path, result, 'utf8', function (err) {
//                 if (err) return reject(err);
//             });
//             resolve()
//         });
//     })
// }
/**
 * 拷贝文件，wepy项目生成build文件夹时需要从根目录把project.config.json拷到build文件夹下面
 * 生成二维码需要此文件
 * @param {源文件} source 
 * @param {目标文件} target 
 */
async function copyFile(source, target) {
    return await new Promise(function (resolve, reject) {
        try {
            fs.copyFileSync(source, target);
            resolve();
        } catch (err) {
            reject(err)
        }
    })
    // var rd = fs.createReadStream(source);
    // var wr = fs.createWriteStream(target);
    // try {
    //     return await new Promise(function (resolve, reject) {
    //         rd.on('error', reject);
    //         wr.on('error', reject);
    //         wr.on('finish', resolve);
    //         rd.pipe(wr);
    //     });
    // } catch (error) {
    //     rd.destroy();
    //     wr.end();
    //     throw error;
    // }
}

async function cmdRun(cmd) {
    return await new Promise(function (resolve, reject) {
        var spawn = require('child_process').spawn,
            child = spawn(cmd, {
                shell: true
            });

        child.stderr.on('data', function (data) {
            console.error("STDERR:", data.toString());
            if (data.toString().indexOf('WARN') == -1) {
                reject(data.toString());
            }
        });
        child.stdout.on('data', async function (data) {
            console.log("STDOUT:", data.toString());
            if (data.toString().indexOf('开始监听') > -1) {
                await configCopy();
                resolve();
            }
        });
        child.on('exit', function (exitCode) {
            console.log("Child exited with code: " + exitCode);
        });
    })
}
/**
 * 编辑project.config.json文件
 * wepy 生成dist目录后没有此文件，所以首次运行需将根目录的config文件拷贝到dist目录下
 */
async function configCopy() {
    return new Promise(async function (resolve, reject) {
        const configName = '/project.config.json';
        const configTargetPath = o.localPath + '/dist' + configName;
        const configResoucePath = o.localPath + configName;
        await configEdit(configResoucePath);
        //将project.config.json拷贝到dist目录下，生成二维码需要此文件
        try {
            await copyFile(configResoucePath, configTargetPath);
            resolve();
        } catch (err) {
            console.log(err);
            reject(err);
            return;
        }
        //将拷贝到dist目录的project.config.json文件替换字符串。因为是从上一级目录拷贝过来的，所以里面的路径需要修改
        // await replaceFileString(configTargetPath);
        resolve();
    })
}
/**   编辑project.config.json文件
 *  * 添加或者修改里面的属性值
 */
async function configEdit(configResoucePath) {
    return new Promise(function (resolve, reject) {
        fs.readFile(configResoucePath, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }
            var json = JSON.parse(data)
            json.setting['nodeModules'] = !!o.needModules;
            json.miniprogramRoot = './';
            fs.writeFile(configResoucePath, JSON.stringify(json, null, 2), (error) => {
                if (error)
                    reject(error);
                resolve();
            });

        })
    })
}
/**                       
 * 执行控制台命令
 * @param {控制台命令} cmd 
 */
async function exec(cmd) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(cmd);
            const {
                stdout,
                stderr
            } = await processExec(cmd);
            if (stderr) {
                let error = stderr;
                const index = error.indexOf('-') + 2;
                error = error.substr(index, stderr.length - index);
                error = JSON.parse(JSON.stringify(error));
                if (error.indexOf('WARN') == -1) {
                    return reject(error);
                }
            }
            resolve(stdout);
        } catch (err) {
            reject(err);
        }
    })
}