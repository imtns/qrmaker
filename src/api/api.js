import axios from 'axios';

let base = '//10.9.130.43:9999';
// let base = '//10.252.70.37:9999';


export const requestLogin = params => {
    return axios.post(`${base}/git/login`, params).then(res => res.data).catch(err => err);
};

// export const requestLogin = params => { return {params:{code:200,msg:'ok',user:null}} };

export const getGitList = params => {
    return axios.get(`${base}/git/list`, {
        params: params
    }).catch(err => err);
};

export const removeGit = params => {
    return axios.get(`${base}/git/remove`, {
        params: params
    }).catch(err => err);
};

export const deleteGit = params => {
    return axios.post(`${base}/git/delete`, {
        params: params
    }).catch(err => err);
};

export const editGit = params => {
    return axios.post(`${base}/git/edit`, {
        params: params
    }).catch(err => err);
};

export const cloneGit = params => {
    return axios.post(`${base}/git/cloneGit`, params).then(res => res.data).catch(err => err);
};

export const addGit = params => {
    return axios.post(`${base}/git/add`, {
        params: params
    }).catch(err => err);
};

export const preview = params => {
    return axios.post(`${base}/git/preview`, params).then(res => res.data).catch(err => err);
};

export const fetchState = params => {
    return axios.post(`${base}/git/fetchState`, params).then(res => res.data).catch(err => err);
};

export const getBranches = params => {
    return axios.post(`${base}/git/getBranches`, params).then(res => res.data).catch(err => err);
};