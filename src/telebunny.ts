import { EventEmitter } from "stream";
import { HTTPSRequest, HTTPSResponse } from "./https";
import * as fs from "fs";

namespace TelegramBotAPI {
    export type update_type = "message" | "edited_message" | "channel_post" | "edited_channel_post" | "inline_query" | "chosen_inline_result" | "callback_query" | "shipping_query" | "pre_checkout_query" | "poll" | "poll_answer" | "my_chat_member" | "chat_member" | "chat_join_request";
}
namespace TeleBunny {
    export interface options {
        polling: boolean;
        frequency?: number;
        interval?: number;
        limit?: number;
        timeout?: number;
        allow?: TelegramBotAPI.update_type[];
        ignore?: TelegramBotAPI.update_type[];
    }
    export type methods = "setWebhook" | "deleteWebhook" | "getWebhookInfo" | "getUpdates" | "getMe" | "sendMessage" | "forwardMessage" | "copyMessage" | "sendPhoto" | "sendAudio" | "sendDocument" | "sendVideo" | "sendAnimation" | "sendVoice" | "sendVideoNote" | "sendMediaGroup" | "sendLocation" | "editMessageLiveLocation" | "stopMessageLiveLocation" | "sendVenue" | "sendContact" | "sendPoll" | "sendDice" | "sendChatAction" | "getUserProfilePhotos" | "getFile" | "banChatMember" | "unbanChatMember" | "restrictChatMember" | "promoteChatMember" | "setChatAdministratorCustomTitle" | "banChatSenderChat" | "unbanChatSenderChat" | "setChatPermissions" | "exportChatInviteLink" | "createChatInviteLink" | "editChatInviteLink" | "revokeChatInviteLink" | "approveChatJoinRequest" | "declineChatJoinRequest" | "setChatPhoto" | "deleteChatPhoto" | "setChatTitle" | "setChatDescription" | "pinChatMessage" | "unpinChatMessage" | "unpinAllChatMessages" | "leaveChat" | "getChat" | "getChatAdministrators" | "getChatMemberCount" | "getChatMember" | "setChatStickerSet" | "deleteChatStickerSet" | "getForumTopicIconStickers" | "createForumTopic" | "editForumTopic" | "closeForumTopic" | "reopenForumTopic" | "deleteForumTopic" | "unpinAllForumTopicMessages" | "editGeneralForumTopic" | "closeGeneralForumTopic" | "reopenGeneralForumTopic" | "hideGeneralForumTopic" | "unhideGeneralForumTopic" | "answerCallbackQuery" | "setMyCommands" | "deleteMyCommands" | "getMyCommands" | "setChatMenuButton" | "getChatMenuButton" | "setMyDefaultAdministratorRights" | "getMyDefaultAdministratorRights" | "editMessageText" | "editMessageCaption" | "editMessageMedia" | "editMessageReplyMarkup" | "stopPoll" | "deleteMessage" | "answerInlineQuery" | "answerWebAppQuery";
    export interface response {
        ok: boolean;
        error_code?: number;
        description?: string;
        result?: object;
    }
    export interface polling {
        _alive: boolean;
        _interval: number;
        _last_update: number;
        _offset?: number;
        _limit?: number;
        _timeout?: number;
        _allow?: string[];
        _ignore?: string[];
    }
}
class TeleBunnyError {
    name: string;
    message: string;
    constructor(message) {
        this.name = "🐰 [TeleBunny] ~";
        this.message = message.toString().replace(/\u{1F430} \[TeleBunny\] ~ ?/ugi, '').replace(/Error: /gi, '');        
        return new Error(this.name.concat(' ', this.message));
    }
}
class TeleBunny {
    private _token: string;
    private _emitter: EventEmitter;
    private _polling?: TeleBunny.polling;
    constructor(api_token: string, options: TeleBunny.options) {
        this._token = api_token;
        this._emitter = new EventEmitter();
        if(options['polling']) this._initPolling(options);
    }
    private _parseMethodOptions(input: object): object {
        if(typeof input !== 'object') throw new TeleBunnyError(`Options argument must be object! Got ${typeof input}`);
        let result = input;
        Object.keys(input).forEach(key => {
            if(typeof input[key] === 'object') result[key] = JSON.stringify(input[key])
        });
        return result;
    }
    private async _telegramRequest(method_name: TeleBunny.methods, data?: object) : Promise<any> {
        const response: HTTPSResponse = await new HTTPSRequest(`api.telegram.org/bot${this._token}/${method_name}`).post('urlencoded', data);
        if(response.json.ok) {
            return response.json.result;
        } else {
            throw new TeleBunnyError(`${response.json.error_code} ${response.json.description}`);
        }
    }
    private _telegramFileRequest(method_name: TeleBunny.methods, data?: object) : Promise<any> {
        return new Promise((resolve, reject) => {
            async function _makeRequest(content_type: 'urlencoded' | 'multipart', data) : Promise<object> {
                const response: HTTPSResponse = await new HTTPSRequest(`api.telegram.org/bot${this._token}/${method_name}`).post(content_type, data);
                if(response.json.ok || response.code === 200) {
                    return response.json.result;
                } else {
                    throw new TeleBunnyError(`${response.json.error_code} ${response.json.description}`);
                }
            }
            function _convertToMulipart(data_obj: object, local_files: Array<string>) : object {  
                return Object.keys(data_obj).map((key) => {
                    let result = {
                        name: Buffer.from(key.toString()),
                        data: Buffer.from(data_obj[key].toString())
                    }
                    if(local_files.includes(data_obj[key])) {
                        result['file'] = Buffer.from(data_obj[key].toString());
                        result['data'] = fs.readFileSync(data_obj[key]);
                    }
                    return result;
                })
            }
            function _getLocalFiles(file_identifiers) : Promise<Array<string> | false> {
                return new Promise(resolve => {
                    let result = [];
                    file_identifiers.forEach(async (identifier: string, i: number) => {
                        try {
                            const stats = await fs.promises.stat(identifier);
                            if(stats.isFile()) result.push(identifier);
                        } catch (error) { } finally {
                            if(i === file_identifiers.length - 1) {
                                resolve(result.length > 0 ? result : false);
                            }
                        }
                    });
                })
            }
            const file_keys = ['certificate', 'photo', 'audio', 'document', 'thumb', 'video', 'animation', 'voice', 'video_note'];
            const file_field_keys = file_keys.filter((key) => data.hasOwnProperty(key));
            if(Array.isArray(data['media'])) {
                data['media'].forEach((media_obj, i) => {
                    const media_key = i.toString();
                    data[media_key] = media_obj['media'];
                    media_obj['media'] = "attach://"+i;
                    file_field_keys.push(media_key);
                    if(media_obj['thumb']) {
                        const thumb_key = 't'.concat(i.toString());
                        data[thumb_key] = media_obj['thumb'];
                        media_obj['thumb'] = "attach://"+thumb_key;
                        file_field_keys.push(thumb_key);
                    }
                });
                this._parseMethodOptions(data);
            }
            if(file_field_keys.length === 0) throw new TeleBunnyError("Cannot find any supported InputFile field!");
            const file_identifiers = file_field_keys.map((key) => data[key]);
            _getLocalFiles(file_identifiers).then((local: Array<string> | false) => {
                try {                  
                    if(local) {
                        resolve(_makeRequest.call(this, 'multipart', _convertToMulipart(data, local)));
                    } else {
                        resolve(_makeRequest.call(this, 'urlencoded', data));
                    }
                } catch (error) {
                    reject(error);
                }
            });      
        })
    }
    private _initPolling(options: TeleBunny.options) {
        function numberBetween(number: number, min: number, max: number): number {
            if(number < min) number = min;
            if(number > max) number = max;
            return number;
        }
        function getAllowValue(allow, ignore): TelegramBotAPI.update_type[] {
            ignore = Array.isArray(ignore) ? ignore : []; 
            allow = Array.isArray(allow) ? allow : update_types;
            return allow.filter(o => !ignore.includes(o));
        }
        function getIntervalValue(interval, frequency): number {
            if(typeof interval === 'number') {
                return numberBetween(interval, 1, Infinity);
            } else if (typeof frequency === 'number') {
                return Math.round(1000 / numberBetween(frequency, 0.00001, 10));
            } else {
                return 300;
            } 
        }
        const update_types: TelegramBotAPI.update_type[] = ["message", "edited_message", "channel_post", "edited_channel_post", "inline_query", "chosen_inline_result", "callback_query", "shipping_query", "pre_checkout_query", "poll", "poll_answer", "my_chat_member", "chat_member", "chat_join_request"];
        const allowed_updates = getAllowValue(options['allow'], options['ignore']) || update_types;
        if(allowed_updates.length <= 0) return;
        this._polling = {
            _alive: true,
            _interval: getIntervalValue(options['interval'], options['frequency']),
            _last_update: 0,
            _offset: options['offset'],
            _limit: numberBetween(options['limit'], 1, 100) || 100,
            _timeout: numberBetween(options['timeout'], 0, Infinity) || 0,
            _allow: allowed_updates
        }
        this._getUpdates();
    }
    private async _getUpdates() {    
        const time_diff = Date.now() - this._polling._last_update;
        if(this._polling._alive && time_diff > this._polling._interval) {
            try {
                const data = await this._telegramRequest("getUpdates", {
                    offset: this._polling._offset,
                    limit: this._polling._limit,
                    timeout: this._polling._timeout,
                    allowed_updates: JSON.stringify(this._polling._allow)
                });
                this._polling._last_update = Date.now();
                if(data.length > 0) {
                    this._polling._offset = data[data.length - 1]['update_id'] + 1;
                    data.forEach(item => {
                        const allowed_tag = this._polling._allow.filter(u => item.hasOwnProperty(u)).join();
                        if(!!allowed_tag) {
                            this._emitter.emit(allowed_tag, item[allowed_tag]);
                        }
                    });
                }
                this._getUpdates();
            } catch (error) {
                this._polling._alive = false;
                throw new TeleBunnyError(error);
            }
        } else {
            setTimeout(() => this._getUpdates(), this._polling._interval - time_diff);
        }
    }
    public got(event_name: string, callback: (...any) => void) {
        this._emitter.on(event_name, callback);
    }
    public on(event_name: string, callback: (...any) => void) {
        this._emitter.on(event_name, callback);
    }
    public setWebhook(url: string, options?: object) {
        if(options['allow'].length <= 0) return;
        return options['certificate'] ? this._telegramFileRequest("setWebhook", options) : this._telegramRequest("setWebhook", options);
    }
    public deleteWebhook(drop_pending_updates?: boolean) {
        return this._telegramRequest("deleteWebhook", { drop_pending_updates: drop_pending_updates });
    }
    public getWebhookInfo() {
        return this._telegramRequest("getWebhookInfo");
    }
    public getMe() {
        return this._telegramRequest("getMe");
    }
    public async sendMessage(chat_id: number | string, text: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendMessage", Object.assign(options || {}, { chat_id: chat_id, text: text }));
    }
    public async forwardMessage(chat_id: number | string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("forwardMessage", Object.assign(options || {}, { chat_id: chat_id }));
    }
    public async copyMessage(chat_id: number | string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("copyMessage", Object.assign(options || {}, { chat_id: chat_id }));
    }
    public async sendPhoto(chat_id: number | string, photo: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendPhoto", Object.assign(options || {}, { chat_id: chat_id, photo: photo }));
    }
    public async sendAudio(chat_id: number | string, audio: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendAudio", Object.assign(options || {}, { chat_id: chat_id, audio: audio }));
    }
    public async sendDocument(chat_id: number | string, document: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendDocument", Object.assign(options || {}, { chat_id: chat_id, document: document }));
    }
    public async sendVideo(chat_id: number | string, video: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendVideo", Object.assign(options || {}, { chat_id: chat_id, video: video }));
    }
    public async sendAnimation(chat_id: number | string, animation: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendAnimation", Object.assign(options || {}, { chat_id: chat_id, animation: animation }));
    }
    public async sendVoice(chat_id: number | string, voice: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendVoice", Object.assign(options || {}, { chat_id: chat_id, voice: voice }));
    }
    public async sendVideoNote(chat_id: number | string, video_note: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendVideoNote", Object.assign(options || {}, { chat_id: chat_id, video_note: video_note }));
    }
    public async sendMediaGroup(chat_id: number | string, media: Array<object>, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("sendMediaGroup", Object.assign(options || {}, { chat_id: chat_id, media: media }));
    }
    public sendLocation(chat_id: number | string, latitude: number, longitude: number, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendLocation", Object.assign(options || {}, { chat_id: chat_id, latitude: latitude, longitude: longitude }));
    }
    public editMessageLiveLocation(latitude: number, longitude: number, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageLiveLocation", Object.assign(options || {}, { latitude: latitude, longitude: longitude }));
    }
    public stopMessageLiveLocation(options?:    object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("stopMessageLiveLocation", Object.assign(options || {}));
    }
    public sendVenue(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendVenue", Object.assign(options || {}));
    }
    public sendContact(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendContact", Object.assign(options || {}));
    }
    public sendPoll(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendPoll", Object.assign(options || {}));
    }
    public sendDice(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendDice", Object.assign(options || {}));
    }
    public sendChatAction(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("sendChatAction", Object.assign(options || {}));
    }
    public getUserProfilePhotos(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getUserProfilePhotos", Object.assign(options || {}));
    }
    public getFile(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getFile", Object.assign(options || {}));
    }
    public banChatMember(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("banChatMember", Object.assign(options || {}));
    }
    public unbanChatMember(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unbanChatMember", Object.assign(options || {}));
    }
    public restrictChatMember(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("restrictChatMember", Object.assign(options || {}));
    }
    public promoteChatMember(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("promoteChatMember", Object.assign(options || {}));
    }
    public setChatAdministratorCustomTitle(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatAdministratorCustomTitle", Object.assign(options || {}));
    }
    public banChatSenderChat(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("banChatSenderChat", Object.assign(options || {}));
    }
    public unbanChatSenderChat(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unbanChatSenderChat", Object.assign(options || {}));
    }
    public setChatPermissions(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatPermissions", Object.assign(options || {}));
    }
    public exportChatInviteLink(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("exportChatInviteLink", Object.assign(options || {}));
    }
    public createChatInviteLink(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("createChatInviteLink", Object.assign(options || {}));
    }
    public editChatInviteLink(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editChatInviteLink", Object.assign(options || {}));
    }
    public revokeChatInviteLink(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("revokeChatInviteLink", Object.assign(options || {}));
    }
    public approveChatJoinRequest(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("approveChatJoinRequest", Object.assign(options || {}));
    }
    public declineChatJoinRequest(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("declineChatJoinRequest", Object.assign(options || {}));
    }
    public setChatPhoto(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatPhoto", Object.assign(options || {}));
    }
    public deleteChatPhoto(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteChatPhoto", Object.assign(options || {}));
    }
    public setChatTitle(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatTitle", Object.assign(options || {}));
    }
    public setChatDescription(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatDescription", Object.assign(options || {}));
    }
    public pinChatMessage(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("pinChatMessage", Object.assign(options || {}));
    }
    public unpinChatMessage(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinChatMessage", Object.assign(options || {}));
    }
    public unpinAllChatMessages(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinAllChatMessages", Object.assign(options || {}));
    }
    public leaveChat(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("leaveChat", Object.assign(options || {}));
    }
    public getChat(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getChat", Object.assign(options || {}));
    }
    public getChatAdministrators(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatAdministrators", Object.assign(options || {}));
    }
    public getChatMemberCount(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMemberCount", Object.assign(options || {}));
    }
    public getChatMember(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMember", Object.assign(options || {}));
    }
    public setChatStickerSet(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatStickerSet", Object.assign(options || {}));
    }
    public deleteChatStickerSet(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteChatStickerSet", Object.assign(options || {}));
    }
    public getForumTopicIconStickers(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getForumTopicIconStickers", Object.assign(options || {}));
    }
    public createForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("createForumTopic", Object.assign(options || {}));
    }
    public editForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editForumTopic", Object.assign(options || {}));
    }
    public closeForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("closeForumTopic", Object.assign(options || {}));
    }
    public reopenForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("reopenForumTopic", Object.assign(options || {}));
    }
    public deleteForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteForumTopic", Object.assign(options || {}));
    }
    public unpinAllForumTopicMessages(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unpinAllForumTopicMessages", Object.assign(options || {}));
    }
    public editGeneralForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editGeneralForumTopic", Object.assign(options || {}));
    }
    public closeGeneralForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("closeGeneralForumTopic", Object.assign(options || {}));
    }
    public reopenGeneralForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("reopenGeneralForumTopic", Object.assign(options || {}));
    }
    public hideGeneralForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("hideGeneralForumTopic", Object.assign(options || {}));
    }
    public unhideGeneralForumTopic(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("unhideGeneralForumTopic", Object.assign(options || {}));
    }
    public answerCallbackQuery(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("answerCallbackQuery", Object.assign(options || {}));
    }
    public setMyCommands(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setMyCommands", Object.assign(options || {}));
    }
    public deleteMyCommands(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("deleteMyCommands", Object.assign(options || {}));
    }
    public getMyCommands(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getMyCommands", Object.assign(options || {}));
    }
    public setChatMenuButton(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("setChatMenuButton", Object.assign(options || {}));
    }
    public getChatMenuButton(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("getChatMenuButton", Object.assign(options || {}));
    }
    public editMessageText(text: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageText", Object.assign(options || {}, { text: text }));
    }
    public editMessageCaption(caption: string, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageCaption", Object.assign(options || {}, { caption: caption }));
    }
    public editMessageMedia(media: object, options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramFileRequest("editMessageMedia", Object.assign(options || {}, { media: media }));
    }
    public editMessageReplyMarkup(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("editMessageReplyMarkup", Object.assign(options || {}));
    }
    public stopPoll(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("stopPoll", Object.assign(options || {}));
    }
    public deleteMessage(chat_id: number | string, message_id: number) {
        return this._telegramRequest("deleteMessage", Object.assign({}, {
            chat_id: chat_id,
            message_id: message_id
        }));
    }
    public answerInlineQuery(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("answerInlineQuery", Object.assign(options || {}));
    }
    public answerWebAppQuery(options?: object) {
        if(options) options = this._parseMethodOptions(options);
        return this._telegramRequest("answerWebAppQuery", Object.assign(options || {}));
    } 
    get token() { return this._token; }
    get method() { 
        return this._polling ? 'polling' : 'webhook'; 
    }
}

export default TeleBunny;