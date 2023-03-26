import * as https from "https";

interface HTTPSResponse {
    code?: number,
    headers?: Object,
    body?: string,
    json?: any
}
class HTTPSRequest {
    private _url: string;
    constructor(url: string, params?: Object) {
        if(url.slice(0, 8) !== 'https://') url = 'https://'.concat(url);
        this._url = url;
        this._enrichURL(params);
    }
    private _enrichURL(params: Object | null | undefined): string | void {
        if(!params) return;
        this._url = this._url.split('?')[0].concat('?', Object.keys(params).map(k => k.concat('=', params[k])).join('&'));
    }
    private _parseData(response, data: Buffer): HTTPSResponse {
        function getJSON(data: Buffer): Object | boolean {
            const result: string = data.toString('utf8');
            try {
                return JSON.parse(result);
            } catch (e) {
                return false;
            }
        }
        function getBody(data: Buffer) {
            return data.toString('utf8');
        }
        return {
            code: response.statusCode,
            headers: response.headers,
            body: getBody(data),
            json: getJSON(data)
        } as HTTPSResponse
    }
    private _generateBoundary() {
        return Buffer.from(Date.now().toString()).toString("base64");
    }
    private _generateFormData(params: Object[], boundary: string) {
        function _getHeaders(name: string, file?: string) {
            const content_type = file ? "application/octet-stream" : "text/plain; charset=UTF-8";
            let result: string = "";
            result += "--" + boundary + "\r\n";
            result += "Content-Disposition: form-data; name=\"" + name + "\"";
            if(file) result += "; filename=\"" + file + "\"" ;
            result += "\r\n"
            result += "Content-Type: " + content_type + "\r\n\r\n";
            return result;
        }
        function _getForm(input_obj: Object[], boundary: string) {
            let result: Buffer = Buffer.from("");
            input_obj.forEach(content => {
                if(!content['name']) throw new Error("Cannot generate form data. 'name' field required");
                if(!content['data']) throw new Error("Cannot generate form data. 'data' field required");
                const headers: string = _getHeaders(content['name'], content['file']);    
                const form_field = Buffer.concat([
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
    }
    private _processURLEncoded(params?: Object) {        
        return new Promise((resolve, reject) => {            
            this._enrichURL(params);

            const hostname: string = this._url.split('/')[2];
            const path:string = this._url.split('?')[0];
            const data:string = this._url.split('?')[1] || '';
                
            const options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data)
                }
            };           

            let chunks = [];
            const req = https.request(options, (res) => {
                res.on('data', (data) => {
                    chunks.push(data)
                });
                res.on('end', () => resolve( 
                    this._parseData(res, Buffer.from(chunks.join("")))
                ));
            });
            req.on('error', (error) => reject(error));                        
            req.write(data);
            req.end();
        })
    }
    private _processMultipartFormData(params: Object[]) {
        return new Promise((resolve, reject) => {
            const boundary: string = this._generateBoundary();
            const form_data: Buffer = this._generateFormData(params, boundary);
            const hostname: string = this._url.split('/')[2];
            const path: string = this._url;
            
            const options = {
                hostname: hostname,
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': "multipart/form-data; boundary="+ boundary,
                    'Content-Length': Buffer.byteLength(form_data)
                }
            };
            let chunks = [];
            const req = https.request(options, res => {
                res.on('data', (data) => {
                    chunks.push(data)
                });
                res.on('end', () => resolve( 
                    this._parseData(res, Buffer.from(chunks.join("")))
                ));
            })
            req.on('error', (error) => reject(error));
            req.write(form_data);
            req.end();
        });
    }
    public get(params?: Object): Promise<HTTPSResponse> {
        this._enrichURL(params);
        // console.log("HTTPS GET Request:", this._url);
        return new Promise((resolve, reject) => {
            let chunks = [];
            const req = https.get(this._url, (res) => {
                res.on('data', (data) => {
                    chunks.push(data)
                });
                res.on('end', () => resolve( 
                    this._parseData(res, Buffer.from(chunks.join("")))
                ));
            });
            req.on('error', (error) => reject(error));
            req.end();
        })
    }
    public post(content_type: 'urlencoded' | 'multipart', params?: Object): Promise<HTTPSResponse> {
        // console.log("HTTPS POST Request:", this._url);
        return new Promise((resolve, reject) => {
            try {
                let request;
                switch (content_type) {
                    case 'urlencoded':
                        request = this._processURLEncoded;
                    break;
                    case 'multipart':
                        request = this._processMultipartFormData;
                    break;
                    default:
                        request = this._processURLEncoded;
                }
                request.call(this, params)
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            } catch (error) {
                reject(error);
            }
        })
    }
}
export default HTTPSRequest;
export {HTTPSRequest, HTTPSResponse};