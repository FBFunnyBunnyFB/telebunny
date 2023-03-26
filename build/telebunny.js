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
var stream_1 = require("stream");
var https_1 = require("./https");
var fs = require("fs");
var TeleBunnyError = (function () {
    function TeleBunnyError(message) {
        this.name = "🐰 [TeleBunny] ~";
        this.message = message.toString().replace(/\u{1F430} \[TeleBunny\] ~ ?/ugi, '').replace(/Error: /gi, '');
        return new Error(this.name.concat(' ', this.message));
    }
    return TeleBunnyError;
}());
var TeleBunny = (function () {
    function TeleBunny(api_token, options) {
        this._token = api_token;
        this._emitter = new stream_1.EventEmitter();
        if (options['polling'])
            this._initPolling(options);
    }
    TeleBunny.prototype._parseMethodOptions = function (input) {
        if (typeof input !== 'object')
            throw new TeleBunnyError("Options argument must be object! Got ".concat(typeof input));
        var result = input;
        Object.keys(input).forEach(function (key) {
            if (typeof input[key] === 'object')
                result[key] = JSON.stringify(input[key]);
        });
        return result;
    };
    TeleBunny.prototype._telegramRequest = function (method_name, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, new https_1.HTTPSRequest("api.telegram.org/bot".concat(this._token, "/").concat(method_name)).post('urlencoded', data)];
                    case 1:
                        response = _a.sent();
                        if (response.json.ok) {
                            return [2, response.json.result];
                        }
                        else {
                            throw new TeleBunnyError("".concat(response.json.error_code, " ").concat(response.json.description));
                        }
                        return [2];
                }
            });
        });
    };
    TeleBunny.prototype._telegramFileRequest = function (method_name, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            function _makeRequest(content_type, data) {
                return __awaiter(this, void 0, void 0, function () {
                    var response;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, new https_1.HTTPSRequest("api.telegram.org/bot".concat(this._token, "/").concat(method_name)).post(content_type, data)];
                            case 1:
                                response = _a.sent();
                                if (response.json.ok || response.code === 200) {
                                    return [2, response.json.result];
                                }
                                else {
                                    throw new TeleBunnyError("".concat(response.json.error_code, " ").concat(response.json.description));
                                }
                                return [2];
                        }
                    });
                });
            }
            function _convertToMulipart(data_obj, local_files) {
                return Object.keys(data_obj).map(function (key) {
                    var result = {
                        name: Buffer.from(key.toString()),
                        data: Buffer.from(data_obj[key].toString())
                    };
                    if (local_files.includes(data_obj[key])) {
                        result['file'] = Buffer.from(data_obj[key].toString());
                        result['data'] = fs.readFileSync(data_obj[key]);
                    }
                    return result;
                });
            }
            function _getLocalFiles(file_identifiers) {
                var _this = this;
                return new Promise(function (resolve) {
                    var result = [];
                    file_identifiers.forEach(function (identifier, i) { return __awaiter(_this, void 0, void 0, function () {
                        var stats, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, 3, 4]);
                                    return [4, fs.promises.stat(identifier)];
                                case 1:
                                    stats = _a.sent();
                                    if (stats.isFile())
                                        result.push(identifier);
                                    return [3, 4];
                                case 2:
                                    error_1 = _a.sent();
                                    return [3, 4];
                                case 3:
                                    if (i === file_identifiers.length - 1) {
                                        resolve(result.length > 0 ? result : false);
                                    }
                                    return [7];
                                case 4: return [2];
                            }
                        });
                    }); });
                });
            }
            var file_keys = ['certificate', 'photo', 'audio', 'document', 'thumb', 'video', 'animation', 'voice', 'video_note'];
            var file_field_keys = file_keys.filter(function (key) { return data.hasOwnProperty(key); });
            if (Array.isArray(data['media'])) {
                data['media'].forEach(function (media_obj, i) {
                    var media_key = i.toString();
                    data[media_key] = media_obj['media'];
                    media_obj['media'] = "attach://" + i;
                    file_field_keys.push(media_key);
                    if (media_obj['thumb']) {
                        var thumb_key = 't'.concat(i.toString());
                        data[thumb_key] = media_obj['thumb'];
                        media_obj['thumb'] = "attach://" + thumb_key;
                        file_field_keys.push(thumb_key);
                    }
                });
                _this._parseMethodOptions(data);
            }
            if (file_field_keys.length === 0)
                throw new TeleBunnyError("Cannot find any supported InputFile field!");
            var file_identifiers = file_field_keys.map(function (key) { return data[key]; });
            _getLocalFiles(file_identifiers).then(function (local) {
                try {
                    if (local) {
                        resolve(_makeRequest.call(_this, 'multipart', _convertToMulipart(data, local)));
                    }
                    else {
                        resolve(_makeRequest.call(_this, 'urlencoded', data));
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    };
    TeleBunny.prototype._initPolling = function (options) {
        function numberBetween(number, min, max) {
            if (number < min)
                number = min;
            if (number > max)
                number = max;
            return number;
        }
        function getAllowValue(allow, ignore) {
            ignore = Array.isArray(ignore) ? ignore : [];
            allow = Array.isArray(allow) ? allow : update_types;
            return allow.filter(function (o) { return !ignore.includes(o); });
        }
        function getIntervalValue(interval, frequency) {
            if (typeof interval === 'number') {
                return numberBetween(interval, 1, Infinity);
            }
            else if (typeof frequency === 'number') {
                return Math.round(1000 / numberBetween(frequency, 0.00001, 10));
            }
            else {
                return 300;
            }
        }
        var update_types = ["message", "edited_message", "channel_post", "edited_channel_post", "inline_query", "chosen_inline_result", "callback_query", "shipping_query", "pre_checkout_query", "poll", "poll_answer", "my_chat_member", "chat_member", "chat_join_request"];
        var allowed_updates = getAllowValue(options['allow'], options['ignore']) || update_types;
        if (allowed_updates.length <= 0)
            return;
        this._polling = {
            _alive: true,
            _interval: getIntervalValue(options['interval'], options['frequency']),
            _last_update: 0,
            _offset: options['offset'],
            _limit: numberBetween(options['limit'], 1, 100) || 100,
            _timeout: numberBetween(options['timeout'], 0, Infinity) || 0,
            _allow: allowed_updates
        };
        this._getUpdates();
    };
    TeleBunny.prototype._getUpdates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var time_diff, data, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        time_diff = Date.now() - this._polling._last_update;
                        if (!(this._polling._alive && time_diff > this._polling._interval)) return [3, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this._telegramRequest("getUpdates", {
                                offset: this._polling._offset,
                                limit: this._polling._limit,
                                timeout: this._polling._timeout,
                                allowed_updates: JSON.stringify(this._polling._allow)
                            })];
                    case 2:
                        data = _a.sent();
                        this._polling._last_update = Date.now();
                        if (data.length > 0) {
                            this._polling._offset = data[data.length - 1]['update_id'] + 1;
                            data.forEach(function (item) {
                                var allowed_tag = _this._polling._allow.filter(function (u) { return item.hasOwnProperty(u); }).join();
                                if (!!allowed_tag) {
                                    _this._emitter.emit(allowed_tag, item[allowed_tag]);
                                }
                            });
                        }
                        this._getUpdates();
                        return [3, 4];
                    case 3:
                        error_2 = _a.sent();
                        this._polling._alive = false;
                        throw new TeleBunnyError(error_2);
                    case 4: return [3, 6];
                    case 5:
                        setTimeout(function () { return _this._getUpdates(); }, this._polling._interval - time_diff);
                        _a.label = 6;
                    case 6: return [2];
                }
            });
        });
    };
    TeleBunny.prototype.got = function (event_name, callback) {
        this._emitter.on(event_name, callback);
    };
    TeleBunny.prototype.on = function (event_name, callback) {
        this._emitter.on(event_name, callback);
    };
    TeleBunny.prototype.setWebhook = function (url, options) {
        if (options['allow'].length <= 0)
            return;
        return options['certificate'] ? this._telegramFileRequest("setWebhook", options) : this._telegramRequest("setWebhook", options);
    };
    TeleBunny.prototype.deleteWebhook = function (drop_pending_updates) {
        return this._telegramRequest("deleteWebhook", { drop_pending_updates: drop_pending_updates });
    };
    TeleBunny.prototype.getWebhookInfo = function () {
        return this._telegramRequest("getWebhookInfo");
    };
    TeleBunny.prototype.getMe = function () {
        return this._telegramRequest("getMe");
    };
    TeleBunny.prototype.sendMessage = function (chat_id, text, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramRequest("sendMessage", Object.assign(options || {}, { chat_id: chat_id, text: text }))];
            });
        });
    };
    TeleBunny.prototype.forwardMessage = function (chat_id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramRequest("forwardMessage", Object.assign(options || {}, { chat_id: chat_id }))];
            });
        });
    };
    TeleBunny.prototype.copyMessage = function (chat_id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramRequest("copyMessage", Object.assign(options || {}, { chat_id: chat_id }))];
            });
        });
    };
    TeleBunny.prototype.sendPhoto = function (chat_id, photo, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendPhoto", Object.assign(options || {}, { chat_id: chat_id, photo: photo }))];
            });
        });
    };
    TeleBunny.prototype.sendAudio = function (chat_id, audio, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendAudio", Object.assign(options || {}, { chat_id: chat_id, audio: audio }))];
            });
        });
    };
    TeleBunny.prototype.sendDocument = function (chat_id, document, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendDocument", Object.assign(options || {}, { chat_id: chat_id, document: document }))];
            });
        });
    };
    TeleBunny.prototype.sendVideo = function (chat_id, video, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendVideo", Object.assign(options || {}, { chat_id: chat_id, video: video }))];
            });
        });
    };
    TeleBunny.prototype.sendAnimation = function (chat_id, animation, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendAnimation", Object.assign(options || {}, { chat_id: chat_id, animation: animation }))];
            });
        });
    };
    TeleBunny.prototype.sendVoice = function (chat_id, voice, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendVoice", Object.assign(options || {}, { chat_id: chat_id, voice: voice }))];
            });
        });
    };
    TeleBunny.prototype.sendVideoNote = function (chat_id, video_note, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendVideoNote", Object.assign(options || {}, { chat_id: chat_id, video_note: video_note }))];
            });
        });
    };
    TeleBunny.prototype.sendMediaGroup = function (chat_id, media, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (options)
                    options = this._parseMethodOptions(options);
                return [2, this._telegramFileRequest("sendMediaGroup", Object.assign(options || {}, { chat_id: chat_id, media: media }))];
            });
        });
    };
    TeleBunny.prototype.sendLocation = function (chat_id, latitude, longitude, options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendLocation", Object.assign(options || {}, { chat_id: chat_id, latitude: latitude, longitude: longitude }));
    };
    TeleBunny.prototype.editMessageLiveLocation = function (latitude, longitude, options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageLiveLocation", Object.assign(options || {}, { latitude: latitude, longitude: longitude }));
    };
    TeleBunny.prototype.stopMessageLiveLocation = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("stopMessageLiveLocation", Object.assign(options || {}));
    };
    TeleBunny.prototype.sendVenue = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendVenue", Object.assign(options || {}));
    };
    TeleBunny.prototype.sendContact = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendContact", Object.assign(options || {}));
    };
    TeleBunny.prototype.sendPoll = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendPoll", Object.assign(options || {}));
    };
    TeleBunny.prototype.sendDice = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendDice", Object.assign(options || {}));
    };
    TeleBunny.prototype.sendChatAction = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("sendChatAction", Object.assign(options || {}));
    };
    TeleBunny.prototype.getUserProfilePhotos = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getUserProfilePhotos", Object.assign(options || {}));
    };
    TeleBunny.prototype.getFile = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getFile", Object.assign(options || {}));
    };
    TeleBunny.prototype.banChatMember = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("banChatMember", Object.assign(options || {}));
    };
    TeleBunny.prototype.unbanChatMember = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unbanChatMember", Object.assign(options || {}));
    };
    TeleBunny.prototype.restrictChatMember = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("restrictChatMember", Object.assign(options || {}));
    };
    TeleBunny.prototype.promoteChatMember = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("promoteChatMember", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatAdministratorCustomTitle = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatAdministratorCustomTitle", Object.assign(options || {}));
    };
    TeleBunny.prototype.banChatSenderChat = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("banChatSenderChat", Object.assign(options || {}));
    };
    TeleBunny.prototype.unbanChatSenderChat = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unbanChatSenderChat", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatPermissions = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatPermissions", Object.assign(options || {}));
    };
    TeleBunny.prototype.exportChatInviteLink = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("exportChatInviteLink", Object.assign(options || {}));
    };
    TeleBunny.prototype.createChatInviteLink = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("createChatInviteLink", Object.assign(options || {}));
    };
    TeleBunny.prototype.editChatInviteLink = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editChatInviteLink", Object.assign(options || {}));
    };
    TeleBunny.prototype.revokeChatInviteLink = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("revokeChatInviteLink", Object.assign(options || {}));
    };
    TeleBunny.prototype.approveChatJoinRequest = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("approveChatJoinRequest", Object.assign(options || {}));
    };
    TeleBunny.prototype.declineChatJoinRequest = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("declineChatJoinRequest", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatPhoto = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatPhoto", Object.assign(options || {}));
    };
    TeleBunny.prototype.deleteChatPhoto = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteChatPhoto", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatTitle = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatTitle", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatDescription = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatDescription", Object.assign(options || {}));
    };
    TeleBunny.prototype.pinChatMessage = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("pinChatMessage", Object.assign(options || {}));
    };
    TeleBunny.prototype.unpinChatMessage = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinChatMessage", Object.assign(options || {}));
    };
    TeleBunny.prototype.unpinAllChatMessages = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinAllChatMessages", Object.assign(options || {}));
    };
    TeleBunny.prototype.leaveChat = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("leaveChat", Object.assign(options || {}));
    };
    TeleBunny.prototype.getChat = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getChat", Object.assign(options || {}));
    };
    TeleBunny.prototype.getChatAdministrators = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatAdministrators", Object.assign(options || {}));
    };
    TeleBunny.prototype.getChatMemberCount = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMemberCount", Object.assign(options || {}));
    };
    TeleBunny.prototype.getChatMember = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMember", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatStickerSet = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatStickerSet", Object.assign(options || {}));
    };
    TeleBunny.prototype.deleteChatStickerSet = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteChatStickerSet", Object.assign(options || {}));
    };
    TeleBunny.prototype.getForumTopicIconStickers = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getForumTopicIconStickers", Object.assign(options || {}));
    };
    TeleBunny.prototype.createForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("createForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.editForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.closeForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("closeForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.reopenForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("reopenForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.deleteForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.unpinAllForumTopicMessages = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinAllForumTopicMessages", Object.assign(options || {}));
    };
    TeleBunny.prototype.editGeneralForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editGeneralForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.closeGeneralForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("closeGeneralForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.reopenGeneralForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("reopenGeneralForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.hideGeneralForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("hideGeneralForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.unhideGeneralForumTopic = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("unhideGeneralForumTopic", Object.assign(options || {}));
    };
    TeleBunny.prototype.answerCallbackQuery = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("answerCallbackQuery", Object.assign(options || {}));
    };
    TeleBunny.prototype.setMyCommands = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setMyCommands", Object.assign(options || {}));
    };
    TeleBunny.prototype.deleteMyCommands = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteMyCommands", Object.assign(options || {}));
    };
    TeleBunny.prototype.getMyCommands = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getMyCommands", Object.assign(options || {}));
    };
    TeleBunny.prototype.setChatMenuButton = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatMenuButton", Object.assign(options || {}));
    };
    TeleBunny.prototype.getChatMenuButton = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMenuButton", Object.assign(options || {}));
    };
    TeleBunny.prototype.editMessageText = function (text, options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageText", Object.assign(options || {}, { text: text }));
    };
    TeleBunny.prototype.editMessageCaption = function (caption, options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageCaption", Object.assign(options || {}, { caption: caption }));
    };
    TeleBunny.prototype.editMessageMedia = function (media, options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramFileRequest("editMessageMedia", Object.assign(options || {}, { media: media }));
    };
    TeleBunny.prototype.editMessageReplyMarkup = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageReplyMarkup", Object.assign(options || {}));
    };
    TeleBunny.prototype.stopPoll = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("stopPoll", Object.assign(options || {}));
    };
    TeleBunny.prototype.deleteMessage = function (chat_id, message_id) {
        return this._telegramRequest("deleteMessage", Object.assign({}, {
            chat_id: chat_id,
            message_id: message_id
        }));
    };
    TeleBunny.prototype.answerInlineQuery = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("answerInlineQuery", Object.assign(options || {}));
    };
    TeleBunny.prototype.answerWebAppQuery = function (options) {
        if (options)
            options = this._parseMethodOptions(options);
        return this._telegramRequest("answerWebAppQuery", Object.assign(options || {}));
    };
    Object.defineProperty(TeleBunny.prototype, "token", {
        get: function () { return this._token; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TeleBunny.prototype, "method", {
        get: function () {
            return this._polling ? 'polling' : 'webhook';
        },
        enumerable: false,
        configurable: true
    });
    return TeleBunny;
}());
exports.default = TeleBunny;
