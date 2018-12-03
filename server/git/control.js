const Git = require('nodegit');
const open = Git.Repository.open;
const config = require('./config');
const fs = require('fs');

const {
    o
} = require('../utils/config');

const {
    startBuildProcess
} = require('../utils/utils');

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
module.exports = {
    /**
     * 从git分支上拉取最新
     */
    async pull() {
        return new Promise(function (resolve, reject) {
            console.log('start pulling...');
            open(o.localPath)
                .then(repo => {
                    repository = repo;
                }).then(() => {
                    return repository.fetchAll(credentials);
                }).then(() => {
                    repository.mergeBranches(o.branch, "origin/" + o.branch);
                })
                .then(() => {
                    //获取分支
                    return checkoutBranch(repository);
                }).then(async () => {
                    console.log('pull done!');
                    if (o.isWepy) {
                        await startBuildProcess();
                    }
                }).then(() => {
                    //生成dist目录
                    console.log('build finished!!!');
                    resolve();
                }).catch((e) => {
                    reject(e)
                })
        })
    },
    /**
         克隆岛本地
     * @param b 分支名
     */
    async cloneToLocal(b) {
        //如果目标目录存在直接拉取最新,否则拷贝目标目录到本地
        o.localPath = o.rootPath + o.projectName + '/' + b;
        if (!fs.existsSync(o.localPath)) {
            // 生成预览二维码txt文件
            o.currentState = 'Cloning...';
            await clone();
        }
    },
    /**
     * 获取所有分支
     * 
     */
    async getAllBranches() {
        return new Promise((resolve, reject) => {
            open(o.localPath).then(function (repo) {
                repository = repo;
                return repo.fetchAll(credentials);
            }).then(function () {
                return repository.getReferenceNames(Git.Reference.TYPE.LISTALL);
            }).then(function (arrayString) {
                console.log(arrayString);
                const arr = arrayString.map(item => {
                    item = item.substr(item.lastIndexOf('/') + 1, item.length - item.lastIndexOf('/'))
                    return item;
                })
                resolve(arr);
            }).catch(err => {
                reject(err);
            })
        })
    }
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
            Git.Clone(o.gitURL, o.localPath, cloneOptions).then(repo => {
                //切换分支
                return checkoutBranch(repo)
            }).done(async () => {
                //拷贝完项目并且切换完分支后  开始install 
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
                return repo.createBranch(o.branch, targetCommit, false);
            })
            .then(function (reference) {
                return repo.checkoutBranch(reference, {});
            })
            .then(function () {
                return repo.getReferenceCommit(
                    "refs/remotes/origin/" + o.branch);
            })
            .then(function (commit) {
                Git.Reset.reset(repo, commit, 3, {});
            })
    } catch (err) {
        console.log(err);
    }
}