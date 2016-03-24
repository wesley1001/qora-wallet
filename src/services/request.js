import qs from 'query-string';
import config from '../configs';


const urlPrefix = config.domain + config.apiPath;


function filterJSON(res) {
    return res.json();
}


function filterStatus(res) {
    if (__DEV__) {
        console.info(res);
    }
    if (res.status >= 200 && res.status < 300) {
        return res
    }
    else {
        let error = new Error(res.statusText);
        error.res = res;
        error.type = 'http';
        throw error;
    }
}


export function get(url, params, options) {
    url = urlPrefix + url;
    if (params) {
        url += `?${qs.stringify(params)}`;
    }

    if (__DEV__) {
        console.info(`GET: ${url}`);
    }

    return fetch(url)
        .then(filterStatus)
        .then(filterJSON);
}


export function post(url, body, options = {}) {
    const {metaType='json'} = options;
    let headers = {
        'Accept': 'application/json'
    };

    let form = JSON.stringify(body);

    if (metaType == 'json') {
        headers = {
            ...headers,
            'Content-Type': 'application/json'
        }
    }

    if (metaType == 'form') {
        form = qs.stringify(body);
        headers = {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    }

    let uri = urlPrefix + url;

    if (__DEV__) {
        console.info(`POST: ${uri}`);
        console.info(`body:`, body)
    }

    return fetch(uri, {
        method: 'POST',
        headers,
        body: form
    })
        .then(filterStatus)
        .then(filterJSON);
}
