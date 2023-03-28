"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_assert_1 = require("node:assert");
var node_test_1 = require("node:test");
var https_1 = require("../src/https");
(0, node_test_1.describe)("HTTPS GET Request", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        (0, node_test_1.it)("should have \"code\" field in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response.hasOwnProperty('code'), true);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("should have \"headers\" field in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response.hasOwnProperty('headers'), true);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("should have \"body\" field in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response.hasOwnProperty('body'), true);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("should have \"json\" field in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response.hasOwnProperty('json'), true);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("https://www.google.com/ should return 200", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response['code'], 200);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("https://www.google.com/ should receive query params", function () { return __awaiter(void 0, void 0, void 0, function () {
            var raw_body, params_body, params_body_alt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/").get()];
                    case 1:
                        raw_body = (_a.sent()).body;
                        return [4, new https_1.HTTPSRequest("https://www.google.com/search?q=Hello+World").get()];
                    case 2:
                        params_body = (_a.sent()).body;
                        return [4, new https_1.HTTPSRequest("https://www.google.com/search").get({ q: "Hello World" })];
                    case 3:
                        params_body_alt = (_a.sent()).body;
                        node_assert_1.strict.deepStrictEqual(raw_body.length !== params_body.length, true);
                        node_assert_1.strict.deepStrictEqual(raw_body.length !== params_body_alt.length, true);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("https://www.google.com/404 should return 404", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("https://www.google.com/404").get()];
                    case 1:
                        response = _a.sent();
                        node_assert_1.strict.deepStrictEqual(response['code'], 404);
                        return [2];
                }
            });
        }); });
        (0, node_test_1.it)("https://bad_host.com/ should return error", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, new https_1.HTTPSRequest("https://bad_host.com/").get()];
                    case 1:
                        response = _a.sent();
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        node_assert_1.strict.deepStrictEqual(error_1['errno'], -3008);
                        node_assert_1.strict.deepStrictEqual(error_1['code'], "ENOTFOUND");
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
        return [2];
    });
}); });
