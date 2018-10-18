const express = require('express');
const sql = require('../controls');
const api = require('../api/api');
const git = require('../git');
const router = express.Router();

// router
router.get(api.gitList, sql.getList);
router.post(api.gitDetail, sql.getById);
router.post(api.gitAdd, sql.add);
router.post(api.gitEdit, sql.edit);
router.post(api.gitDelete, sql.delete);
router.post(api.login, sql.login);
router.post(api.regist, sql.regist);
router.post(api.preview, git.preview);
router.post(api.cloneGit, git.cloneGit);
router.post(api.getBranches, git.getBraches);
router.post(api.fetchState, git.fetchState);
module.exports = router 