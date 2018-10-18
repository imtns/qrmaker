module.exports = {
    getById: 'SELECT * FROM projects WHERE id=?',
    del: 'DELETE FROM projects WHERE id IN ?',
    insert: 'INSERT INTO projects (project_name, git_url,git_username,git_password,codetype,folder,create_time,update_time) VALUES(?,?,?,?,?,?,?,?)',
    update: 'UPDATE projects SET project_name=?, git_url=?, git_username=?, git_password=?,codetype=?,folder=?,update_time=? WHERE id=?',
    login: 'SELECT * FROM USER WHERE username=? and password=?',
    regist: 'INSERT INTO USER (username, password,create_time) VALUES(?,?,?)'
};