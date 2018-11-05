// const childProcess = require('child_process');
// const {
//     spawn
// } = childProcess;
const util = require('util');
const Git = require('nodegit');
const fs = require('fs');
const config = require('./config');
// const processMap = {};

const processExec = util.promisify(require('child_process').exec);
const qrcodePath = "D:/tmp/qrcode/";
const open = Git.Repository.open;
let localPath = "";
let projectName, gitURL, branch = 'master',
    isWepy = false;
let currentState = 'Starting...';

//git认证
const credentials = {
    callbacks: {
        credentials: function () {
            return Git.Cred.userpassPlaintextNew(config.username, config.password);
        },
        certificateCheck: function () {
            return 1;
        }
    }
}
/**
 * 
 * 获取最新git代码
 * 
 */
module.exports = {
    //获取所有分支
    async getBraches(req, res) {
        try {
            ({
                project_name: projectName,
                git_url: gitURL,
            } = req.body);
            localPath = 'D:/tmp/';
            localPath = localPath + projectName + '/master';
            if (!fs.existsSync(localPath)) {
                await cloneToLocal('master');
            }
            open(localPath).then(function (repo) {
                return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
            }).then(function (arrayString) {
                console.log(arrayString);
                const arr = arrayString.map(item => {
                    item = item.substr(item.lastIndexOf('/') + 1, item.length - item.lastIndexOf('/'))
                    return item;
                })
                res.status(200).json({
                    msg: "OK",
                    data: arr
                });
            }).catch(function (err) {
                res.status(500).json({
                    msg: err,
                    data: []
                });
            }).done(function () {
                console.log("finish");
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
                git_url: gitURL,
                project_name: projectName,
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
            msg: currentState
        });
    },
    /**
     * 生成二维码
     */
    async preview(req, res) {
        try {
            ({
                git_url: gitURL,
                project_name: projectName,
                branch,
                isWepy,
                folder
            } = req.body);
            isWepy = (isWepy === '是')

            console.log('clone to local...');
            await cloneToLocal(branch);
            console.log('clone done!');

            const qrPath = qrcodePath + "/" + projectName + "/" + branch;
            const qrFilePath = qrPath + "/qrcode.txt";

            //每次清空二维码，否则会存在过期的情况
            if (!fs.existsSync(qrcodePath + "/" + projectName)) {
                fs.mkdirSync(qrcodePath + "/" + projectName);
            }
            if (!fs.existsSync(qrPath)) {
                fs.mkdirSync(qrPath);
            }
            fs.writeFileSync(qrFilePath, "")

            await pull();
            try {
                await makingQR();
            } catch (err) {
                currentState = "";
                let message = "";
                if (err.indexOf('登录') > -1) {
                    message = '请联系管理员重新登录开发者工具'
                } else if (err.indexOf('存在') > -1) {
                    message = '开发者工具已存在相同项目名称, 请修改名称后生成'
                } else {
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

            currentState = '';
            console.log('QR finished!!!');
        } catch (err) {
            res.json({
                code: -100,
                msg: err.message,
            });
            currentState = '';
            console.log(err.message);
        }
    },

}

/**
 * @param b 分支名
 */
async function cloneToLocal(b) {
    localPath = 'D:/tmp/';
    //如果目标目录存在直接拉取最新,否则拷贝目标目录到本地
    localPath = localPath + projectName + '/' + b;
    if (!fs.existsSync(localPath)) {
        // 生成预览二维码txt文件
        currentState = 'Cloning...';
        await clone();
    }
    console.log('git project exist');
}
/**                       
 * 执行控制台命令
 * @param {控制台命令} cmd 
 */
async function exec(cmd) {
    return new Promise(async (resolve, reject) => {
        console.log(cmd);
        const {
            stdout,
            stderr
        } = await processExec(cmd);

        if (stderr) {
            reject(stderr);
        }

        resolve(stdout);
    })
}
/**
 * 如果本地文件没有此项目，将从git上clone下来
 * @param {*} req 
 * @param {*} res 
 */
async function clone() {
    return new Promise((resolve, reject) => {
        try {
            const cloneOptions = {
                fetchOpts: credentials
            };
            //从远程git地址拷贝到本地
            Git.Clone(gitURL, localPath, cloneOptions).then(repo => {
                //切换分支
                return checkoutBranch(repo)
            }).done(async () => {
                //拷贝完项目并且切换完分支后  开始install 
                if (isWepy) {
                    currentState = 'Installing...'
                    await exec(`cd ${localPath} && npm install`);
                }
                console.log('npm install');
                resolve();
            })
        } catch (err) {
            reject(err.message);
        }
    })
}

//切换分支
async function checkoutBranch(repo) {
    try {
        repo.getHeadCommit()
            .then(function (targetCommit) {
                return repo.createBranch(branch, targetCommit, false);
            })
            .then(function (reference) {
                return repo.checkoutBranch(reference, {});
            })
            .then(function () {
                return repo.getReferenceCommit(
                    "refs/remotes/origin/" + branch);
            })
            .then(function (commit) {
                Git.Reset.reset(repo, commit, 3, {});
            })
    } catch (err) {

    }
}

function startBuildProcess() {
    return new Promise(async (resolve, reject) => {
        // if (processMap[localPath]) {
        //     setTimeout(() => {
        //         resolve();
        //     }, 3000);
        //     return;
        // }


        //执行run build 生成dist目录
        currentState = 'Building...'

        // const buildProcess = spawn('bash');
        try {
            await exec(`cd ${localPath} && npm run build \n`)
            // buildProcess.stdin.write(`cd ${localPath} \n`);
            // buildProcess.stdin.write(`npm run gemini \n`);
            // buildProcess.stdin.end();
            // useTimer = true;
            // return resolve();
        } catch (err) {
            reject(`PROCESS ERROR: ${err.toString()}`)
        }
        // let timer = null;
        // let useTimer = false;
        // buildProcess.stdout.on('data', data => {
        //     const output = data.toString();
        //     console.log('stdout:', output);
        //     // 准备好监听了
        //     if (~output.indexOf('监听')) {
        //         useTimer = true;
        //         return resolve();
        //     }
        // });
        // buildProcess.stderr.on('data', data => {
        //     console.log('stderr:', data.toString());
        // });
        // buildProcess.on('error', err => {
        //     console.log(`PROCESS ERROR: ${err.toString()}`);
        //     reject(`PROCESS ERROR: ${err.toString()}`)
        // });
        // buildProcess.on('close', code => {
        //     console.log('进程关闭，code:', code);
        //     resolve(code);
        // });

        // processMap[localPath] = buildProcess;

        resolve();
    })
}

/**
 * 从git分支上拉取最新
 */
function pull() {
    console.log('start pulling...');
    return open(localPath)
        .then(repo => {
            repository = repo;
        }).then(() => {
            return repository.fetchAll(credentials);
        }).then(() => {
            repository.mergeBranches(branch, "origin/" + branch);
        })
        .then(() => {
            //获取分支
            return checkoutBranch(repository);
        }).then(async () => {
            console.log('pull done!');
            if (isWepy) {
                await startBuildProcess();
                const configName = '/project.config.json';
                const configTargetPath = localPath + '/dist/' + configName;
                const configResoucePath = localPath + configName;
                if (!fs.existsSync(configTargetPath)) {
                    //将project.config.json拷贝到dist目录下，生成二维码需要此文件
                    await copyFile(configResoucePath, configTargetPath);
                    //将拷贝到dist目录的project.config.json文件替换字符串。因为是从上一级目录拷贝过来的，所以里面的路径需要修改
                    await replaceFileString(configTargetPath);
                }
            }
        }).then(() => {
            //生成dist目录
            console.log('build finished!!!');
        });
}
/**
 * 拷贝文件，wepy项目生成build文件夹时需要从根目录把project.config.json拷到build文件夹下面
 * 生成二维码需要此文件
 * @param {源文件} source 
 * @param {目标文件} target 
 */
async function copyFile(source, target) {
    var rd = fs.createReadStream(source);
    var wr = fs.createWriteStream(target);
    try {
        return await new Promise(function (resolve, reject) {
            rd.on('error', reject);
            wr.on('error', reject);
            wr.on('finish', resolve);
            rd.pipe(wr);
        });
    } catch (error) {
        rd.destroy();
        wr.end();
        throw error;
    }
}
async function replaceFileString(path) {
    return await new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) {
                return reject(err);
            }
            var result = data.replace('./dist', '');
            fs.writeFile(path, result, 'utf8', function (err) {
                if (err) return reject(err);
            });
            resolve()
        });
    })
}
/**
 * 执行控制台命令生成二维码
 * 采用微信cli控制台命令
 * 文档地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
 * 注:执行命令需要开启微信web开发者工具
 */
function makingQR() {
    return new Promise(async function (resolve, reject) {
        console.log('making QRCode...');
        // /*采用命令行方式运行接口 */
        const dist = `${localPath}${isWepy?'/dist':`/${folder}`}`;
        currentState = 'Making QR...'
        try {
            const result = await exec(`cli -p ${dist} --preview-qr-output base64@${qrcodePath}${projectName}/${branch}/qrcode.txt`)
            console.log(result);
        } catch (e) {
            reject(e.message);
        }
        resolve();
    })
}
//读取文件
async function readModuleFile(path) {
    return new Promise(async (resolve, reject) => {
        const filename = require.resolve(path);
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) {
                reject(err)
            }
            resolve(data);
        });
    })
}