"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPSRequest = void 0;
var https = require("https");
var HTTPSRequest = (function () {
    function HTTPSRequest(url, params) {
        if (url.slice(0, 8) !== 'https://')
            url = 'https://'.concat(url);
        this._url = url;
        this._enrichURL(params);
    }
    HTTPSRequest.prototype._enrichURL = function (params) {
        if (!params)
            return;
        this._url = this._url.split('?')[0].concat('?', Object.keys(params).map(function (k) { return k.concat('=', params[k]); }).join('&'));
    };
    HTTPSRequest.prototype._parseData = function (response, data) {
        function getJSON(data) {
            var result = data.toString('utf8');
            try {
                return JSON.parse(result);
            }
            catch (e) {
                return false;
            }
        }
        function getBody(data) {
            return data.toString('utf8');
        }
        return {
            code: response.statusCode,
            headers: response.headers,
            body: getBody(data),
            json: getJSON(data)
        };
    };
    HTTPSRequest.prototype._generateBoundary = function () {
        return Buffer.from(Date.now().toString()).toString("base64");
    };
    HTTPSRequest.prototype._generateFormData = function (params, boundary) {
        function _getHeaders(name, file) {
            var content_type = file ? "application/octet-stream" : "text/plain; charset=UTF-8";
            var result = "";
            result += "--" + boundary + "\r\n";
            result += "Content-Disposition: form-data; name=\"" + name + "\"";
            if (file)
                result += "; filename=\"" + file + "\"";
            result += "\r\n";
            result += "Content-Type: " + content_type + "\r\n\r\n";
            return result;
        }
        function _getForm(input_obj, boundary) {
            var result = Buffer.from("");
            input_obj.forEach(function (content) {
                if (!content['name'])
                    throw new Error("Cannot generate form data. 'name' field required");
                if (!content['data'])
                    throw new Error("Cannot generate form data. 'data' field required");
                var headers = _getHeaders(content['name'], content['file']);
                var form_field = Buffer.concat([
                    Buffer.from(headers, 'utf8'),
                    content['data'],
                    Buffer.from("\r\n", "utf8")
                ]);
                result = Buffer.concat([result, form_field]);
            });
            result = Buffer.concat([result, Buffer.from("--" + boundary + "--\r\n", "utf8")]);
            return result;
        }
        return _getForm(params, boundary);
    };
    HTTPSRequest.prototype._processURLEncoded = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._enrichURL(params);
            var hostname = _this._url.split('/')[2];
            var path = _this._url.split('?')[0];
            var data = _this._url.split('?')[1] || '';
            var options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            var chunks = [];
            var req = https.request(options, function (res) {
                res.on('data', function (data) {
                    chunks.push(data);
                });
                res.on('end', function () { return resolve(_this._parseData(res, Buffer.from(chunks.join("")))); });
            });
            req.on('error', function (error) { return reject(error); });
            req.write(data);
            req.end();
        });
    };
    HTTPSRequest.prototype._processMultipartFormData = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var boundary = _this._generateBoundary();
            var form_data = _this._generateFormData(params, boundary);
            var hostname = _this._url.split('/')[2];
            var path = _this._url;
            var options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': "multipart/form-data; boundary=" + boundary,
                    'Content-Length': Buffer.byteLength(form_data)
                }
            };
            var chunks = [];
            var req = https.request(options, function (res) {
                res.on('data', function (data) {
                    chunks.push(data);
                });
                res.on('end', function () { return resolve(_this._parseData(res, Buffer.from(chunks.join("")))); });
            });
            req.on('error', function (error) { return reject(error); });
            req.write(form_data);
            req.end();
        });
    };
    HTTPSRequest.prototype.get = function (params) {
        var _this = this;
        this._enrichURL(params);
        return new Promise(function (resolve, reject) {
            var chunks = [];
            var req = https.get(_this._url, function (res) {
                res.on('data', function (data) {
                    chunks.push(data);
                });
                res.on('end', function () { return resolve(_this._parseData(res, Buffer.from(chunks.join("")))); });
            });
            req.on('error', function (error) { return reject(error); });
            req.end();
        });
    };
    HTTPSRequest.prototype.post = function (content_type, params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var request = void 0;
                switch (content_type) {
                    case 'urlencoded':
                        request = _this._processURLEncoded;
                        break;
                    case 'multipart':
                        request = _this._processMultipartFormData;
                        break;
                    default:
                        request = _this._processURLEncoded;
                }
                request.call(_this, params)
                    .then(function (result) { return resolve(result); })
                    .catch(function (error) { return reject(error); });
            }
            catch (error) {
                reject(error);
            }
        });
    };
    return HTTPSRequest;
}());
exports.HTTPSRequest = HTTPSRequest;
exports.default = HTTPSRequest;
