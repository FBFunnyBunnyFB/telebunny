import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { HTTPSRequest, HTTPSResponse } from "../src/https.js";

describe("HTTPS GET Request", async () => {
    it("should have \"code\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get").get();
        assert.deepStrictEqual(response.hasOwnProperty('code'), true);
    });
    it("should have \"headers\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get").get();
        assert.deepStrictEqual(response.hasOwnProperty('headers'), true);
    });
    it("should have \"body\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get").get();
        assert.deepStrictEqual(response.hasOwnProperty('body'), true);
    });
    it("should have \"json\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get").get();
        assert.deepStrictEqual(response.hasOwnProperty('json'), true);
    });
    it("https://httpbin.org/get should return 200", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get").get();
        assert.deepStrictEqual(response['code'], 200);
    });
    it("https://httpbin.org/get should receive query params", async () => {
        const { json: raw_json } = await new HTTPSRequest("https://httpbin.org/get").get();
        const { json: params_json } = await new HTTPSRequest("https://httpbin.org/get?message=Hello+World").get();
        const { json: params_json_alt } = await new HTTPSRequest("https://httpbin.org/get").get({ message: "Hello World Again" });
        assert.deepStrictEqual(raw_json['args'], {});
        assert.deepStrictEqual(params_json['args'], { message: "Hello World" });
        assert.deepStrictEqual(params_json_alt['args'], { message: "Hello World Again" });
    });
    it("https://httpbin.org/get/404 should return 404", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/get/404").get();
        assert.deepStrictEqual(response['code'], 404);
    });
    it("https://bad_host.com/ should return error", async () => {
        try {
            const response: HTTPSResponse = await new HTTPSRequest("https://bad_host.com/").get();
        } catch (error) {
            assert.deepStrictEqual(error['errno'], -3008);
            assert.deepStrictEqual(error['code'], "ENOTFOUND");
        }
    });
});
describe("HTTPS POST Request", async () => {
    it("should have \"code\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded");
        assert.deepStrictEqual(response.hasOwnProperty('code'), true);
    });
    it("should have \"headers\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded");
        assert.deepStrictEqual(response.hasOwnProperty('headers'), true);
    });
    it("should have \"body\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded");
        assert.deepStrictEqual(response.hasOwnProperty('body'), true);
    });
    it("should have \"json\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded");
        assert.deepStrictEqual(response.hasOwnProperty('json'), true);
    });
    it("https://httpbin.org/post should return 200", async () => {
        const { code } = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded");
        assert.deepStrictEqual(code, 200);
    });
    it("https://httpbin.org/post should receive urlencoded params", async () => {
        const { json } = await new HTTPSRequest("https://httpbin.org/post").post("urlencoded", {
            test: true,
            test_str: "Hello World",
            test_obj: JSON.stringify({
                x: 10,
                y: 15
            })
        });
        assert.deepStrictEqual(json['form']['test'], "true");
        assert.deepStrictEqual(json['form']['test_str'], "Hello World");
        assert.deepStrictEqual(json['form']['test_obj'], "{\"x\":10,\"y\":15}");
    });
    it("https://httpbin.org/post should receive multipart params", async () => {
        const { json } = await new HTTPSRequest("https://httpbin.org/post").post("multipart", [
            {
                name: "multipart_field1",
                data: Buffer.from (
                    JSON.stringify({
                        test: true,
                        test_str: "Hello World",
                        test_obj: {
                            x: 10,
                            y: 15
                        }
                    })
                )
            },{
                name: "multipart_field2",
                data: Buffer.from (
                    JSON.stringify({
                        test: false,
                        test_arr: ["First", "Second", true],
                        test_obj: {
                            nest_obj: {
                                nested: true
                            }
                        }
                    })
                )
            }
        ]);
        assert.deepStrictEqual(json['form'].hasOwnProperty("multipart_field1"), true);
        assert.deepStrictEqual(json['form'].hasOwnProperty("multipart_field2"), true);
        const field1 = JSON.parse(json['form']['multipart_field1']);
        assert.deepStrictEqual(field1['test'], true);
        assert.deepStrictEqual(field1['test_str'], "Hello World");
        assert.deepStrictEqual(field1['test_obj'], { x: 10, y: 15 });
        const field2 = JSON.parse(json['form']['multipart_field2']);
        assert.deepStrictEqual(field2['test'], false);
        assert.deepStrictEqual(field2['test_arr'], ["First", "Second", true]);
        assert.deepStrictEqual(field2['test_obj'], { nest_obj: { nested: true } });
        assert.deepStrictEqual(field2['test_str'], undefined);
    });
    it("https://httpbin.org/post should return 404", async () => {
        const { code } = await new HTTPSRequest("https://httpbin.org/post/404").post("urlencoded");
        assert.deepStrictEqual(code, 404);
    });
    it("https://bad_host.com/ should return error", async () => {
        try {
            const response: HTTPSResponse = await new HTTPSRequest("https://bad_host.com/").post("urlencoded");
        } catch (error) {
            assert.deepStrictEqual(error['errno'], -3008);
            assert.deepStrictEqual(error['code'], "ENOTFOUND");
        }
    });
});