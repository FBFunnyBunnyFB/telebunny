import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { HTTPSRequest, HTTPSResponse } from "../src/https";

describe("HTTPS GET Request", async () => {
    it("should have \"code\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/").get();
        assert.deepStrictEqual(response.hasOwnProperty('code'), true);
    });
    it("should have \"headers\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/").get();
        assert.deepStrictEqual(response.hasOwnProperty('headers'), true);
    });
    it("should have \"body\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/").get();
        assert.deepStrictEqual(response.hasOwnProperty('body'), true);
    });
    it("should have \"json\" field in response", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/").get();
        assert.deepStrictEqual(response.hasOwnProperty('json'), true);
    });
    it("https://www.google.com/ should return 200", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/").get();
        assert.deepStrictEqual(response['code'], 200);
    });
    it("https://www.google.com/ should receive query params", async () => {
        const { body: raw_body } = await new HTTPSRequest("https://www.google.com/").get();
        const { body: params_body } = await new HTTPSRequest("https://www.google.com/search?q=Hello+World").get();
        const { body: params_body_alt } = await new HTTPSRequest("https://www.google.com/search").get({ q: "Hello World" });
        // Checksum of request with no params should differ
        assert.deepStrictEqual(raw_body.length !== params_body.length, true);
        // Testing alternative method of passing params
        assert.deepStrictEqual(raw_body.length !== params_body_alt.length, true);
    });
    it("https://www.google.com/404 should return 404", async () => {
        const response: HTTPSResponse = await new HTTPSRequest("https://www.google.com/404").get();
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
})