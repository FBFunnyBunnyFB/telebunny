import { EventEmitter } from "events";
import { HTTPSRequest, HTTPSResponse } from "./https.js";
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
    private _parseMethodArgs(options: any[], options_mask?: string[]): object {
        function isRawOptions() {
            return options.length === 1 &&
            typeof options[0] === 'object' &&
            options[0]['constructor'] === Object;
        }
        function stringifyObjects(input) {
            let result = input;
            Object.keys(input).forEach(key => {
                if(typeof input[key] === 'object') result[key] = JSON.stringify(input[key]);
            });
            return result;
        }
        if(isRawOptions()) return stringifyObjects(options[0]);
        let result = {};
        if(options_mask) {
            // Parse required arguments
            options_mask.forEach((field, i) => {
                if(!options[i]) throw new TeleBunnyError(`Cannot find "${field}" options field. Expected index for argument - ${i+1}`);
                result[field] = options[i];
            });
            // Parse additional arguments
            const additional_options = options.slice(options_mask.length);
            additional_options.forEach((option, i) => {
                result = Object.assign(additional_options[i], result);
            });
        }
        // Parse object typed options & return
        return stringifyObjects(result);
    }
    private async _telegramRequest(method_name: string, data?: object) : Promise<any> {
        const response: HTTPSResponse = await new HTTPSRequest(`api.telegram.org/bot${this._token}/${method_name}`).post('urlencoded', data);
        if(response.json.ok) {
            return response.json.result;
        } else {
            throw new TeleBunnyError(`${response.json.error_code} ${response.json.description}`);
        }
    }
    private _telegramFileRequest(method_name: string, data?: object) : Promise<any> {
        return new Promise(async (resolve, reject) => {
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
            function _getLocalFiles(input_obj: object, file_fields: string[]) : Promise<string[]> {
                return new Promise(resolve => {
                    let pending_stats = [];
                    // Remove missing file fields
                    file_fields = file_fields.filter(f_f => input_obj.hasOwnProperty(f_f));
                    file_fields.forEach(field => {
                        pending_stats.push(fs.promises.stat(input_obj[field]));
                    });
                    // Wait until all data received
                    Promise.allSettled(pending_stats).then((promise_results: PromiseSettledResult<fs.Stats>[]) => {
                        // If local file exists - true, otherwise - false
                        const local_file_map = promise_results.map(promise => {
                            if(promise['status'] === "rejected") return false;
                            return promise['value'].isFile()
                        });
                        // Get local files path using local_file_map
                        let result = [];
                        file_fields.forEach((field, i) => {
                            if(local_file_map[i]) result.push(input_obj[field])
                        });
                        resolve(result);
                    });
                })
            }
            function _getMultifileField(input: object): string {
                const multifile_field_keys = ['media', 'stickers'];
                return Object.keys(input).find(field => multifile_field_keys.includes(field));
            }
            function _getFileFields(input: object): string[] {
                const file_field_keys = ['certificate', 'photo', 'audio', 'document', 'thumbnail', 'video', 'animation', 'voice', 'video_note', 'sticker'];
                return Object.keys(input).filter(field => file_field_keys.includes(field));
            }
            const [multifile_field, file_fields] = [_getMultifileField(data), _getFileFields(data)];
            if(multifile_field) {
                let [local_files, attach_index] = [[], 0];
                const file_obj_arr = JSON.parse(data[multifile_field]);
                const file_obj_fields = ['media', 'sticker', 'thumbnail'];
                for (const file_obj of file_obj_arr) {
                    const obj_local_files: string[] = await _getLocalFiles(file_obj, file_obj_fields).catch(error => { reject(error); return [] });
                    obj_local_files.forEach(local_file => {
                        for (const file_obj_field of file_obj_fields) {
                            if(file_obj[file_obj_field] === local_file) {
                                const media_key = attach_index.toString();
                                data[media_key] = file_obj[file_obj_field];
                                file_obj[file_obj_field] = "attach://"+attach_index;
                                local_files.push(data[media_key]);
                                attach_index++;
                            }
                        }
                    });
                }
                data[multifile_field] = JSON.stringify(file_obj_arr);
                resolve(_makeRequest.call(this, 'multipart', _convertToMulipart(data, local_files)));
            } else if (file_fields.length > 0) {
                _getLocalFiles(data, file_fields).then((local_files: string[]) => {
                    if(local_files.length > 0) {
                        resolve(_makeRequest.call(this, 'multipart', _convertToMulipart(data, local_files)));
                    } else {
                        resolve(_makeRequest.call(this, 'urlencoded', data));
                    }
                }).catch(error => reject(error));
            } else {
                throw new TeleBunnyError("Cannot find any supported InputFile field!");
            }
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
    // Listeners
    public got(event_name: string, callback: (...any) => void) {
        this._emitter.on(event_name, callback);
    }
    public on(event_name: string, callback: (...any) => void) {
        this._emitter.on(event_name, callback);
    }
    // Getting updates
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
    // Available methods
    public getMe() {
        return this._telegramRequest("getMe");
    }
    public logOut() {
        return this._telegramRequest("logOut");
    }
    public close() {
        return this._telegramRequest("close");
    }
    public sendMessage(chat_id: string | number, text: string, options?: Object);
    public sendMessage(options: Object);
    public sendMessage(...options) {
        return this._telegramRequest("sendMessage", this._parseMethodArgs(options, ["chat_id", "text"]));
    }
    public forwardMessage(chat_id: string | number, from_chat_id: string | number, message_id: number, options?: Object);
    public forwardMessage(options: Object);
    public forwardMessage(...options) {
        return this._telegramRequest("forwardMessage", this._parseMethodArgs(options, ["chat_id", "from_chat_id", "message_id"]));
    }
    public copyMessage(chat_id: string | number, from_chat_id: string | number, message_id: number, options?: Object);
    public copyMessage(options: Object);
    public copyMessage(...options) {
        return this._telegramRequest("copyMessage", this._parseMethodArgs(options, ["chat_id", "from_chat_id", "message_id"]));
    }
    public sendPhoto(chat_id: string | number, photo: string, options?: Object);
    public sendPhoto(options: Object);
    public sendPhoto(...options) {
        return this._telegramFileRequest("sendPhoto", this._parseMethodArgs(options, ["chat_id", "photo"]));
    }
    public sendAudio(chat_id: string | number, audio: string, options?: Object);
    public sendAudio(options: Object);
    public sendAudio(...options) {
        return this._telegramFileRequest("sendAudio", this._parseMethodArgs(options, ["chat_id", "audio"]));
    }
    public sendDocument(chat_id: string | number, document: string, options?: Object);
    public sendDocument(options: Object);
    public sendDocument(...options) {
        return this._telegramFileRequest("sendDocument", this._parseMethodArgs(options, ["chat_id", "document"]));
    }
    public sendVideo(chat_id: string | number, video: string, options?: Object);
    public sendVideo(options: Object);
    public sendVideo(...options) {
        return this._telegramFileRequest("sendVideo", this._parseMethodArgs(options, ["chat_id", "video"]));
    }
    public sendAnimation(chat_id: string | number, animation: string, options?: Object);
    public sendAnimation(options: Object);
    public sendAnimation(...options) {
        return this._telegramFileRequest("sendAnimation", this._parseMethodArgs(options, ["chat_id", "animation"]));
    }
    public sendVoice(chat_id: string | number, voice: string, options?: Object);
    public sendVoice(options: Object);
    public sendVoice(...options) {
        return this._telegramFileRequest("sendVoice", this._parseMethodArgs(options, ["chat_id", "voice"]));
    }
    public sendVideoNote(chat_id: string | number, video_note: string, options?: Object);
    public sendVideoNote(options: Object);
    public sendVideoNote(...options) {
        return this._telegramFileRequest("sendVideoNote", this._parseMethodArgs(options, ["chat_id", "video_note"]));
    }
    public sendMediaGroup(chat_id: string | number, media: any | Array<object>, options?: Object);
    public sendMediaGroup(options: Object);
    public sendMediaGroup(...options) {
        return this._telegramFileRequest("sendMediaGroup", this._parseMethodArgs(options, ["chat_id", "media"]));
    }
    public sendLocation(chat_id: number | string, latitude: number, longitude: number, options?: Object);
    public sendLocation(options: Object);
    public sendLocation(...options) {
        return this._telegramRequest("sendLocation", this._parseMethodArgs(options, ["chat_id", "latitude", "longitude"]));
    }
    public sendVenue(chat_id: number | string, latitude: number, longitude: number, title: string, address: string, options?: Object);
    public sendVenue(options: Object);
    public sendVenue(...options) {
        return this._telegramRequest("sendVenue", this._parseMethodArgs(options, ["chat_id", "latitude", "longitude", "title", "address"]));
    }
    public sendContact(chat_id: number | string, phone_number: string, first_name: string, options?: Object);
    public sendContact(options: Object);
    public sendContact(...options) {
        return this._telegramRequest("sendContact", this._parseMethodArgs(options, ["chat_id", "phone_number", "first_name"]));
    }
    public sendPoll(chat_id: number | string, question: string, options: string[], additional_options?: Object);
    public sendPoll(options: Object);
    public sendPoll(...options) {
        return this._telegramRequest("sendPoll", this._parseMethodArgs(options, ["chat_id", "question", "options"]));
    }
    public sendDice(chat_id: number | string, options?: Object);
    public sendDice(options: Object);
    public sendDice(...options) {
        return this._telegramRequest("sendDice", this._parseMethodArgs(options, ["chat_id"]));
    }
    public sendChatAction(chat_id: number | string, action: string, options?: Object);
    public sendChatAction(options: Object);
    public sendChatAction(...options) {
        return this._telegramRequest("sendChatAction", this._parseMethodArgs(options, ["chat_id", "action"]));
    }
    public getUserProfilePhotos(user_id: number, options?: Object);
    public getUserProfilePhotos(options: Object);
    public getUserProfilePhotos(...options) {
        return this._telegramRequest("getUserProfilePhotos", this._parseMethodArgs(options, ["user_id"]));
    }
    public getFile(file_id: string);
    public getFile(options: Object);
    public getFile(...options) {
        return this._telegramRequest("getFile", this._parseMethodArgs(options, ["file_id"]));
    }
    public banChatMember(chat_id: number | string, user_id: number, options?: Object);
    public banChatMember(options: Object);
    public banChatMember(...options) {
        return this._telegramRequest("banChatMember", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public unbanChatMember(chat_id: number | string, user_id: number, options?: Object);
    public unbanChatMember(options: Object);
    public unbanChatMember(...options) {
        return this._telegramRequest("unbanChatMember", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public restrictChatMember(chat_id: number | string, user_id: number, permissions: Object, options?: Object);
    public restrictChatMember(options: Object);
    public restrictChatMember(...options) {
        return this._telegramRequest("restrictChatMember", this._parseMethodArgs(options, ["chat_id", "user_id", "permissions"]));
    }
    public promoteChatMember(chat_id: number | string, user_id: number, options?: Object);
    public promoteChatMember(options: Object);
    public promoteChatMember(...options) {
        return this._telegramRequest("promoteChatMember", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public setChatAdministratorCustomTitle(chat_id: number | string, user_id: number, custom_title: string, options?: Object);
    public setChatAdministratorCustomTitle(options: Object);
    public setChatAdministratorCustomTitle(...options) {
        return this._telegramRequest("setChatAdministratorCustomTitle", this._parseMethodArgs(options, ["chat_id", "user_id", "custom_title"]));
    }
    public banChatSenderChat(chat_id: number | string, sender_chat_id: number, options?: Object);
    public banChatSenderChat(options: Object);
    public banChatSenderChat(...options) {
        return this._telegramRequest("banChatSenderChat", this._parseMethodArgs(options, ["chat_id", "sender_chat_id"]));
    }
    public unbanChatSenderChat(chat_id: number | string, sender_chat_id: number, options?: Object);
    public unbanChatSenderChat(options: Object);
    public unbanChatSenderChat(...options) {
        return this._telegramRequest("unbanChatSenderChat", this._parseMethodArgs(options, ["chat_id", "sender_chat_id"]));
    }
    public setChatPermissions(chat_id: number | string, permissions: Object, options?: Object);
    public setChatPermissions(options: Object);
    public setChatPermissions(...options) {
        return this._telegramRequest("setChatPermissions", this._parseMethodArgs(options, ["chat_id", "permissions"]));
    }
    public exportChatInviteLink(chat_id: string);
    public exportChatInviteLink(options: Object);
    public exportChatInviteLink(...options) {
        return this._telegramRequest("exportChatInviteLink", this._parseMethodArgs(options, ["chat_id"]));
    }
    public createChatInviteLink(chat_id: number | string, options?: Object);
    public createChatInviteLink(options: Object);
    public createChatInviteLink(...options) {
        return this._telegramRequest("createChatInviteLink", this._parseMethodArgs(options, ["chat_id"]));
    }
    public editChatInviteLink(chat_id: number | string, invite_link: string, options?: Object);
    public editChatInviteLink(options: Object);
    public editChatInviteLink(...options) {
        return this._telegramRequest("editChatInviteLink", this._parseMethodArgs(options, ["chat_id", "invite_link"]));
    }
    public revokeChatInviteLink(chat_id: number | string, invite_link: string);
    public revokeChatInviteLink(options: Object);
    public revokeChatInviteLink(...options) {
        return this._telegramRequest("revokeChatInviteLink", this._parseMethodArgs(options, ["chat_id", "invite_link"]));
    }
    public approveChatJoinRequest(chat_id: number | string, user_id: number);
    public approveChatJoinRequest(options: Object);
    public approveChatJoinRequest(...options) {
        return this._telegramRequest("approveChatJoinRequest", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public declineChatJoinRequest(chat_id: number | string, user_id: number);
    public declineChatJoinRequest(options: Object);
    public declineChatJoinRequest(...options) {
        return this._telegramRequest("declineChatJoinRequest", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public setChatPhoto(chat_id: number | string, photo: string);
    public setChatPhoto(options: Object);
    public setChatPhoto(...options) {
        return this._telegramFileRequest("setChatPhoto", this._parseMethodArgs(options, ["chat_id", "photo"]));
    }
    public deleteChatPhoto(chat_id: number | string);
    public deleteChatPhoto(options: Object);
    public deleteChatPhoto(...options) {
        return this._telegramRequest("deleteChatPhoto", this._parseMethodArgs(options, ["chat_id"]));
    }
    public setChatTitle(chat_id: number | string, title: string);
    public setChatTitle(options: Object);
    public setChatTitle(...options) {
        return this._telegramRequest("setChatTitle", this._parseMethodArgs(options, ["chat_id", "title"]));
    }
    public setChatDescription(chat_id: number | string, options?: Object);
    public setChatDescription(options: Object);
    public setChatDescription(...options) {
        return this._telegramRequest("setChatDescription", this._parseMethodArgs(options, ["chat_id"]));
    }
    public pinChatMessage(chat_id: number | string, message_id: number, options?: Object);
    public pinChatMessage(options: Object);
    public pinChatMessage(...options) {
        return this._telegramRequest("pinChatMessage", this._parseMethodArgs(options, ["chat_id", "message_id"]));
    }
    public unpinChatMessage(chat_id: number | string, options?: Object);
    public unpinChatMessage(options: Object);
    public unpinChatMessage(...options) {
        return this._telegramRequest("unpinChatMessage", this._parseMethodArgs(options, ["chat_id"]));
    }
    public unpinAllChatMessages(chat_id: number | string);
    public unpinAllChatMessages(options: Object);
    public unpinAllChatMessages(...options) {
        return this._telegramRequest("unpinAllChatMessages", this._parseMethodArgs(options, ["chat_id"]));
    }
    public leaveChat(chat_id: number | string);
    public leaveChat(options: Object);
    public leaveChat(...options) {
        return this._telegramRequest("leaveChat", this._parseMethodArgs(options, ["chat_id"]));
    }
    public getChat(chat_id: number | string);
    public getChat(options: Object);
    public getChat(...options) {
        return this._telegramRequest("getChat", this._parseMethodArgs(options, ["chat_id"]));
    }
    public getChatAdministrators(chat_id: number | string);
    public getChatAdministrators(options: Object);
    public getChatAdministrators(...options) {
        return this._telegramRequest("getChatAdministrators", this._parseMethodArgs(options, ["chat_id"]));
    }
    public getChatMemberCount(chat_id: number | string);
    public getChatMemberCount(options: Object);
    public getChatMemberCount(...options) {
        return this._telegramRequest("getChatMemberCount", this._parseMethodArgs(options, ["chat_id"]));
    }
    public getChatMember(chat_id: number | string, user_id: number);
    public getChatMember(options: Object);
    public getChatMember(...options) {
        return this._telegramRequest("getChatMember", this._parseMethodArgs(options, ["chat_id", "user_id"]));
    }
    public setChatStickerSet(chat_id: number | string, sticker_set_name: string);
    public setChatStickerSet(options: Object);
    public setChatStickerSet(...options) {
        return this._telegramRequest("setChatStickerSet", this._parseMethodArgs(options, ["chat_id", "sticker_set_name"]));
    }
    public deleteChatStickerSet(chat_id: number | string);
    public deleteChatStickerSet(options: Object);
    public deleteChatStickerSet(...options) {
        return this._telegramRequest("deleteChatStickerSet", this._parseMethodArgs(options, ["chat_id"]));
    }
    public getForumTopicIconStickers() {
        return this._telegramRequest("getForumTopicIconStickers");
    }
    public createForumTopic(chat_id: number | string, name: string, options?: Object);
    public createForumTopic(options: Object);
    public createForumTopic(...options) {
        return this._telegramRequest("createForumTopic", this._parseMethodArgs(options, ["chat_id", "name"]));
    }
    public editForumTopic(chat_id: number | string, message_thread_id: number, options?: Object);
    public editForumTopic(options: Object);
    public editForumTopic(...options) {
        return this._telegramRequest("editForumTopic", this._parseMethodArgs(options, ["chat_id", "message_thread_id"]));
    }
    public closeForumTopic(chat_id: number | string, message_thread_id: number);
    public closeForumTopic(options: Object);
    public closeForumTopic(...options) {
        return this._telegramRequest("closeForumTopic", this._parseMethodArgs(options, ["chat_id", "message_thread_id"]));
    }
    public reopenForumTopic(chat_id: number | string, message_thread_id: number);
    public reopenForumTopic(options: Object);
    public reopenForumTopic(...options) {
        return this._telegramRequest("reopenForumTopic", this._parseMethodArgs(options, ["chat_id", "message_thread_id"]));
    }
    public deleteForumTopic(chat_id: number | string, message_thread_id: number);
    public deleteForumTopic(options: Object);
    public deleteForumTopic(...options) {
        return this._telegramRequest("deleteForumTopic", this._parseMethodArgs(options, ["chat_id", "message_thread_id"]));
    }
    public unpinAllForumTopicMessages(chat_id: number | string, message_thread_id: number);
    public unpinAllForumTopicMessages(options: Object);
    public unpinAllForumTopicMessages(...options) {
        return this._telegramRequest("unpinAllForumTopicMessages", this._parseMethodArgs(options, ["chat_id", "message_thread_id"]));
    }
    public editGeneralForumTopic(chat_id: number | string, name: string);
    public editGeneralForumTopic(options: Object);
    public editGeneralForumTopic(...options) {
        return this._telegramRequest("editGeneralForumTopic", this._parseMethodArgs(options, ["chat_id", "name"]));
    }
    public closeGeneralForumTopic(chat_id: number | string);
    public closeGeneralForumTopic(options: Object);
    public closeGeneralForumTopic(...options) {
        return this._telegramRequest("editGeneralForumTopic", this._parseMethodArgs(options, ["chat_id"]));
    }
    public reopenGeneralForumTopic(chat_id: number | string);
    public reopenGeneralForumTopic(options: Object);
    public reopenGeneralForumTopic(...options) {
        return this._telegramRequest("reopenGeneralForumTopic", this._parseMethodArgs(options, ["chat_id"]));
    }
    public hideGeneralForumTopic(chat_id: number | string);
    public hideGeneralForumTopic(options: Object);
    public hideGeneralForumTopic(...options) {
        return this._telegramRequest("hideGeneralForumTopic", this._parseMethodArgs(options, ["chat_id"]));
    }
    public unhideGeneralForumTopic(chat_id: number | string);
    public unhideGeneralForumTopic(options: Object);
    public unhideGeneralForumTopic(...options) {
        return this._telegramRequest("unhideGeneralForumTopic", this._parseMethodArgs(options, ["chat_id"]));
    }
    public answerCallbackQuery(callback_query_id: string, options?: Object);
    public answerCallbackQuery(options: Object);
    public answerCallbackQuery(...options) {
        return this._telegramRequest("answerCallbackQuery", this._parseMethodArgs(options, ["callback_query_id"]));
    }
    public setMyCommands(commands: Object[], options?: Object);
    public setMyCommands(options: Object);
    public setMyCommands(...options) {
        return this._telegramRequest("setMyCommands", this._parseMethodArgs(options, ["commands"]));
    }
    public deleteMyCommands(options?: Object) {
        return this._telegramRequest("deleteMyCommands", this._parseMethodArgs([options]));
    }
    public getMyCommands(options?: Object) {
        return this._telegramRequest("getMyCommands", this._parseMethodArgs([options]));
    }
    public setMyDescription(options?: Object) {
        return this._telegramRequest("setMyDescription", this._parseMethodArgs([options]));
    }
    public getMyDescription(options?: Object) {
        return this._telegramRequest("getMyDescription", this._parseMethodArgs([options]));
    }
    public setMyShortDescription(options?: Object) {
        return this._telegramRequest("setMyShortDescription", this._parseMethodArgs([options]));
    }
    public getMyShortDescription(options?: Object) {
        return this._telegramRequest("getMyShortDescription", this._parseMethodArgs([options]));
    }
    public setChatMenuButton(options?: Object) {
        return this._telegramRequest("setChatMenuButton", this._parseMethodArgs([options]));
    }
    public getChatMenuButton(options?: Object) {
        return this._telegramRequest("getChatMenuButton", this._parseMethodArgs([options]));
    }
    public setMyDefaultAdministratorRights(options?: Object) {
        return this._telegramRequest("setMyDefaultAdministratorRights", this._parseMethodArgs([options]));
    }
    public getMyDefaultAdministratorRights(options?: Object) {
        return this._telegramRequest("getMyDefaultAdministratorRights", this._parseMethodArgs([options]));
    }
    // Inline mode
    public answerInlineQuery(inline_query_id: string, results: Object[], options?: Object);
    public answerInlineQuery(options: Object);
    public answerInlineQuery(...options) {
        return this._telegramRequest("answerInlineQuery", this._parseMethodArgs(options, ["inline_query_id", "results"]));
    }
    public answerWebAppQuery(web_app_query_id: string, result: Object);
    public answerWebAppQuery(options: Object);
    public answerWebAppQuery(...options) {
        return this._telegramRequest("answerWebAppQuery", this._parseMethodArgs(options, ["web_app_query_id", "result"]));
    }
    // Updating messages
    public editMessageText(text: string, options: Object);
    public editMessageText(options: Object);
    public editMessageText(...options) {
        return this._telegramRequest("editMessageText", this._parseMethodArgs(options, ["text"]));
    }
    public editMessageCaption(options: Object) {
        return this._telegramRequest("editMessageCaption", this._parseMethodArgs([options]));
    }
    public editMessageMedia(media: Object, options: Object);
    public editMessageMedia(options: Object);
    public editMessageMedia(...options) {
        return this._telegramFileRequest("editMessageMedia", this._parseMethodArgs(options, ["media"]));
    }
    public editMessageReplyMarkup(options: Object) {
        return this._telegramRequest("editMessageReplyMarkup", this._parseMethodArgs([options]));
    }
    public editMessageLiveLocation(latitude: number, longitude: number, options?: Object);
    public editMessageLiveLocation(options: Object);
    public editMessageLiveLocation(...options) {
        return this._telegramRequest("editMessageLiveLocation", this._parseMethodArgs(options, ["latitude", "longitude"]));
    }
    public stopMessageLiveLocation(options: Object) {
        return this._telegramRequest("stopMessageLiveLocation", this._parseMethodArgs([options]));
    }
    public stopPoll(chat_id: number | string, message_id: number, options?: Object);
    public stopPoll(options: Object);
    public stopPoll(...options) {
        return this._telegramRequest("stopPoll", this._parseMethodArgs(options, ["chat_id", "message_id"]));
    }
    public deleteMessage(chat_id: number | string, message_id: number);
    public deleteMessage(options: Object);
    public deleteMessage(...options) {
        return this._telegramRequest("deleteMessage", this._parseMethodArgs(options, ["chat_id", "message_id"]));
    }
    // Stickers
    public sendSticker(chat_id: string | number, sticker: string, options?: Object);
    public sendSticker(options: Object);
    public sendSticker(...options) {
        return this._telegramFileRequest("sendSticker", this._parseMethodArgs(options, ["chat_id", "sticker"]));
    }
    public getStickerSet(name: string);
    public getStickerSet(options: Object);
    public getStickerSet(...options) {
        return this._telegramRequest("getStickerSet", this._parseMethodArgs(options, ["name"]));
    }
    public getCustomEmojiStickers(custom_emoji_ids: string[]);
    public getCustomEmojiStickers(options: Object);
    public getCustomEmojiStickers(...options) {
        return this._telegramRequest("getCustomEmojiStickers", this._parseMethodArgs(options, ["custom_emoji_ids"]));
    }
    public uploadStickerFile(user_id: number, sticker: string, sticker_format: string, options?: Object);
    public uploadStickerFile(options: Object);
    public uploadStickerFile(...options) {
        return this._telegramFileRequest("uploadStickerFile", this._parseMethodArgs(options, ["user_id", "sticker", "sticker_format"]));
    }
    public createNewStickerSet(user_id: number, name: string, title: string, stickers: Object[], sticker_format: string, options?: Object);
    public createNewStickerSet(options: Object);
    public createNewStickerSet(...options) {
        return this._telegramFileRequest("createNewStickerSet", this._parseMethodArgs(options, ["user_id", "name", "title", "stickers", "sticker_format"]));
    }
    public addStickerToSet(user_id: number, name: string, sticker: Object);
    public addStickerToSet(options: Object);
    public addStickerToSet(...options) {
        return this._telegramFileRequest("addStickerToSet", this._parseMethodArgs(options, ["user_id", "name", "sticker"]));
    }
    public setStickerPositionInSet(sticker: string, position: number);
    public setStickerPositionInSet(options: Object);
    public setStickerPositionInSet(...options) {
        return this._telegramRequest("setStickerPositionInSet", this._parseMethodArgs(options, ["sticker", "position"]));
    }
    public deleteStickerFromSet(sticker: string);
    public deleteStickerFromSet(options: Object);
    public deleteStickerFromSet(...options) {
        return this._telegramRequest("deleteStickerFromSet", this._parseMethodArgs(options, ["sticker"]));
    }
    public setStickerEmojiList(sticker: string, emoji_list: string[]);
    public setStickerEmojiList(options: Object);
    public setStickerEmojiList(...options) {
        return this._telegramRequest("setStickerEmojiList", this._parseMethodArgs(options, ["sticker", "emoji_list"]));
    }
    public setStickerKeywords(sticker: string, options?: Object);
    public setStickerKeywords(options: Object);
    public setStickerKeywords(...options) {
        return this._telegramRequest("setStickerKeywords", this._parseMethodArgs(options, ["sticker"]));
    }
    public setStickerMaskPosition(sticker: string, options?: Object);
    public setStickerMaskPosition(options: Object);
    public setStickerMaskPosition(...options) {
        return this._telegramRequest("setStickerMaskPosition", this._parseMethodArgs(options, ["sticker"]));
    }
    public setStickerSetTitle(name: string, title: string);
    public setStickerSetTitle(options: Object);
    public setStickerSetTitle(...options) {
        return this._telegramRequest("setStickerSetTitle", this._parseMethodArgs(options, ["name", "title"]));
    }
    public setStickerSetThumbnail(name: string, user_id: number, options?: Object);
    public setStickerSetThumbnail(options: Object);
    public setStickerSetThumbnail(...options) {
        return this._telegramFileRequest("setStickerSetThumbnail", this._parseMethodArgs(options, ["name", "user_id"]));
    }
    public setCustomEmojiStickerSetThumbnail(name: string, options?: Object);
    public setCustomEmojiStickerSetThumbnail(options: Object);
    public setCustomEmojiStickerSetThumbnail(...options) {
        return this._telegramRequest("setCustomEmojiStickerSetThumbnail", this._parseMethodArgs(options, ["name"]));
    }
    public deleteStickerSet(name: string);
    public deleteStickerSet(options: Object);
    public deleteStickerSet(...options) {
        return this._telegramRequest("deleteStickerSet", this._parseMethodArgs(options, ["name"]));
    }
    // Payments
    public sendInvoice(chat_id: string | number, title: string, description: string, payload: string, provider_token: string, currency: string, prices: Object[], options?: Object);
    public sendInvoice(options: Object);
    public sendInvoice(...options) {
        return this._telegramRequest("sendInvoice", this._parseMethodArgs(options, ["chat_id", "title", "description", "payload", "provider_token", "currency", "prices"]));
    }
    public createInvoiceLink(title: string, description: string, payload: string, provider_token: string, currency: string, prices: Object[], options?: Object);
    public createInvoiceLink(options: Object);
    public createInvoiceLink(...options) {
        return this._telegramRequest("createInvoiceLink", this._parseMethodArgs(options, ["title", "description", "payload", "provider_token", "currency", "prices"]));
    }
    public answerShippingQuery(shipping_query_id: string, ok: boolean, options?: Object);
    public answerShippingQuery(options: Object);
    public answerShippingQuery(...options) {
        return this._telegramRequest("answerShippingQuery", this._parseMethodArgs(options, ["shipping_query_id", "ok"]));
    }
    public answerPreCheckoutQuery(pre_checkout_query_id: string, ok: boolean, options?: Object);
    public answerPreCheckoutQuery(options: Object);
    public answerPreCheckoutQuery(...options) {
        return this._telegramRequest("answerShippingQuery", this._parseMethodArgs(options, ["pre_checkout_query_id", "ok"]));
    }
    public setPassportDataErrors(user_id: number, errors: Object[]);
    public setPassportDataErrors(options: Object);
    public setPassportDataErrors(...options) {
        return this._telegramRequest("setPassportDataErrors", this._parseMethodArgs(options, ["user_id", "errors"]));
    }
    // Games
    public sendGame(chat_id: number, game_short_name: string, options?: Object);
    public sendGame(options: Object);
    public sendGame(...options) {
        return this._telegramRequest("sendGame", this._parseMethodArgs(options, ["chat_id", "game_short_name"]));
    }
    public setGameScore(user_id: number, score: number, options?: Object);
    public setGameScore(options: Object);
    public setGameScore(...options) {
        return this._telegramRequest("setGameScore", this._parseMethodArgs(options, ["user_id", "score"]));
    }
    public getGameHighScores(user_id: number, options: Object);
    public getGameHighScores(options: Object);
    public getGameHighScores(...options) {
        return this._telegramRequest("getGameHighScores", this._parseMethodArgs(options, ["user_id"]));
    }
    get token() { return this._token; }
    get method() {
        return this._polling ? 'polling' : 'webhook';
    }
}

export default TeleBunny;
