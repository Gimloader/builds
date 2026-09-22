/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author Gimloader Official
 * @version 0.6.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/libraries/Communication.js
 * @webpage https://gimloader.github.io/libraries/Communication
 * @gamemode 2d
 * @changelog Allowed sending messages when in the lobby (by using stickers)
 * @isLibrary true
 * @signature 6gPzSWRPuYlmwADD98PPSvPPJVZSYmeFocp+pyhz4H36AxQeku53K0XHrb+CqkeF9AZcew/WvkFmlat57HNfDw==
 */

// libraries/Communication/src/consts.ts
var stickerIdentifierLength = 9;
var stickerMessageSizeLength = 5;
var sizeNumbers = [0.1, 0.15, 0.2, 0.25];
var sizes = ["Small", "Normal", "Large", "Extra Large"];
var placements = ["Below", "Exact", "Above"];
var maxStickersBeforeWait = 500;
var stickerWait = 200;
var maxStickerMessageLength = 12 ** stickerMessageSizeLength;
var maxDozensInt = 12 ** 11;

// libraries/Communication/src/encoding.ts
var isUint8 = (n) => Number.isInteger(n) && n >= 0 && n <= 255;
var isUint24 = (n) => Number.isInteger(n) && n >= 0 && n <= 16777215;
var splitUint24 = (int) => [
  int >> 16 & 255,
  int >> 8 & 255,
  int & 255
];
var joinUint24 = (int1, int2, int3) => int1 << 16 | int2 << 8 | int3;
function bytesToFloat(bytes) {
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 8; i++) {
    view[i] = bytes[i] ?? 0;
  }
  return new Float64Array(buffer)[0];
}
function floatToBytes(float) {
  const buffer = new ArrayBuffer(8);
  const floatView = new Float64Array(buffer);
  floatView[0] = float;
  const byteView = new Uint8Array(buffer);
  return Array.from(byteView);
}
function dozensToFloat(dozens) {
  let number = 0n;
  for (const dozen of dozens) {
    number *= 12n;
    number += BigInt(dozen);
  }
  const bytes = new Array(8).fill(0);
  for (let i = bytes.length - 1; i >= 0; i--) {
    bytes[i] = Number(number & 0xFFn);
    number >>= 8n;
  }
  return bytesToFloat(bytes);
}
function floatToDozens(float) {
  const bytes = floatToBytes(float);
  let number = 0n;
  for (const byte of bytes) {
    number <<= 8n;
    number |= BigInt(byte);
  }
  const dozens = new Array(18).fill(0);
  for (let i = dozens.length - 1; i >= 0; i--) {
    dozens[i] = Number(number % 12n);
    number /= 12n;
  }
  return dozens;
}
function getIdentifier(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hash = hash * 31 + charCode | 0;
  }
  return hash >>> 0;
}
function identifierToBytes(identifier) {
  return [
    identifier >>> 24 & 255,
    identifier >>> 16 & 255,
    identifier >>> 8 & 255,
    identifier & 255
  ];
}
function identifierToDozens(identifier) {
  return numberToDozens(identifier, stickerIdentifierLength);
}
function joinUint32(bytes) {
  return bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3];
}
function numberToDozens(number, size) {
  const dozens = new Array(size).fill(0);
  for (let i = size - 1; i >= 0; i--) {
    dozens[i] = number % 12;
    number = Math.floor(number / 12);
  }
  return dozens;
}
function dozensToNumber(dozens) {
  let result = 0;
  for (let i = 0; i < dozens.length; i++) {
    result *= 12;
    result += dozens[i];
  }
  return result;
}
function encodeCharacters(characters) {
  return characters.split("").map((c) => c.charCodeAt(0)).filter((c) => c < 256 && c > 0);
}
function bytesToDozens(bytes) {
  const output = [];
  let accum = 0;
  let bitLength = 0;
  for (const byte of bytes) {
    accum |= byte << bitLength;
    bitLength += 8;
    while (bitLength > (accum & 1 ? 3 : 4)) {
      if (accum & 1) {
        output.push(((accum & 6) >> 1) + 8);
        bitLength -= 3;
        accum >>= 3;
      } else {
        output.push((accum & 14) >> 1);
        bitLength -= 4;
        accum >>= 4;
      }
    }
  }
  if (bitLength > 0) {
    if (accum & 1) {
      output.push(((accum & 6) >> 1) + 8);
    } else {
      output.push((accum & 14) >> 1);
    }
  }
  return output;
}
function dozensToBytes(dozens, state) {
  const output = [];
  let accum = state?.[0] ?? 0;
  let bitLength = state?.[1] ?? 0;
  for (const number of dozens) {
    if (number < 8) {
      accum |= number << bitLength + 1;
      bitLength += 4;
    } else {
      accum |= (number - 8 << 1) + 1 << bitLength;
      bitLength += 3;
    }
    if (bitLength >= 8) {
      bitLength -= 8;
      const byte = accum & 255;
      accum >>= 8;
      output.push(byte);
    }
  }
  return { result: output, state: [accum, bitLength] };
}
function indexOfSubarray(array, subarray) {
  for (let i = 0; i <= array.length - subarray.length; i++) {
    let found = true;
    for (let j = 0; j < subarray.length; j++) {
      if (array[i + j] !== subarray[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

// libraries/Communication/src/streamer.ts
var Streamer = class _Streamer {
  constructor(identifier) {
    this.identifier = identifier;
    _Streamer.callbacks.set(identifier, this.callbacks);
  }
  static callbacks = /* @__PURE__ */ new Map();
  static updateCallbacks = /* @__PURE__ */ new Map();
  static startStream(callbacks, char, initial, done, map) {
    const subscriptions = [];
    this.updateCallbacks.set(char, subscriptions);
    for (const callback of callbacks) {
      callback((sub) => {
        subscriptions.push((data, done2) => {
          sub(map ? map(...data) : data, done2);
        });
      }, char);
    }
    this.onStreamData(char, initial, done);
  }
  static onStreamData(char, data, done) {
    const subscriptions = this.updateCallbacks.get(char);
    if (!subscriptions) return;
    for (const sub of subscriptions) sub(data, done);
    if (done) this.updateCallbacks.delete(char);
  }
  static onMessage(identifier, value, char) {
    const callbacks = _Streamer.callbacks.get(identifier);
    if (!callbacks) return;
    callbacks.message.forEach((cb) => {
      cb(value, char);
    });
  }
  callbacks = {
    byteStream: [],
    message: [],
    stringStream: []
  };
  destroy() {
    _Streamer.callbacks.delete(this.identifier);
  }
};

// libraries/Communication/src/messengers/aiming.ts
var AimingMessenger = class _AimingMessenger {
  constructor(identifierBytes) {
    this.identifierBytes = identifierBytes;
  }
  static realAngle = 0;
  static angleChangeRes = null;
  static angleChangeRej = null;
  static angleQueue = [];
  static messageState = /* @__PURE__ */ new WeakMap();
  static alternate = false;
  static ignoreNextAngle = false;
  static init() {
    api.net.colyseus.on("send:AIMING", (message, editFn) => {
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.realAngle = message.angle;
      if (this.angleQueue.length > 0) editFn(null);
    });
    api.onStop(
      api.net.colyseus.state.characters.get(api.stores.network.authId).projectiles.listen("aimAngle", (angle) => {
        if (!angle || angle !== this.angleQueue[0]?.angle) return;
        this.angleChangeRes?.();
      }, false)
    );
    const scene = api.stores.phaser.scene;
    api.patcher.after(scene.characterManager, "addCharacter", (_, __, character) => {
      this.listenToCharacter(character);
    });
    for (const character of scene.characterManager.characters.values()) {
      this.listenToCharacter(character);
    }
  }
  static listenToCharacter(character) {
    if (character.id === api.stores.network.authId) return;
    api.patcher.before(character.aimingAndLookingAround, "setTargetAngle", (_, [angle]) => {
      const netChar = api.net.colyseus.state.characters.get(character.id);
      _AimingMessenger.handleBytes(netChar, floatToBytes(angle));
      return true;
    });
  }
  static reset() {
    this.angleQueue.forEach((pending) => pending.resolvers.reject());
    this.angleQueue.length = 0;
    this.angleChangeRej?.();
  }
  async send(message) {
    switch (typeof message) {
      case "number":
        if (isUint24(message)) {
          return await this.sendPositiveInt24(message);
        } else if (isUint24(-message)) {
          return await this.sendNegativeInt24(message);
        } else {
          return await this.sendFloat(message);
        }
      case "string":
        return await this.sendString(message);
      case "boolean":
        return await this.sendBoolean(message);
      case "object":
        if (Array.isArray(message) && message.every((element) => typeof element === "number") && message.every(isUint8) && message.length > 0) {
          return await this.sendBytes(message);
        } else {
          return await this.sendObject(message);
        }
      default:
        throw new Error(`Cannot send message of type ${typeof message}`);
    }
  }
  async sendBoolean(value) {
    await this.sendHeader(0 /* Boolean */, value ? 1 : 0);
  }
  async sendPositiveInt24(value) {
    const bytes = splitUint24(value);
    await this.sendHeader(1 /* PositiveInt24 */, ...bytes);
  }
  async sendNegativeInt24(value) {
    const bytes = splitUint24(-value);
    await this.sendHeader(2 /* NegativeInt24 */, ...bytes);
  }
  async sendFloat(value) {
    const bytes = floatToBytes(value);
    await this.sendSpreadBytes(3 /* Float */, bytes);
  }
  async sendByte(byte) {
    await this.sendHeader(8 /* Byte */, byte);
  }
  async sendBytes(bytes) {
    if (bytes.length === 1) await this.sendHeader(8 /* Byte */, bytes[0]);
    else if (bytes.length === 2) await this.sendHeader(9 /* TwoBytes */, ...bytes);
    else if (bytes.length === 3) await this.sendHeader(10 /* ThreeBytes */, ...bytes);
    else await this.sendSpreadBytes(11 /* SeveralBytes */, bytes);
  }
  async sendString(string) {
    if (string.length <= 3) {
      return await this.sendHeader(4 /* ThreeCharacters */, ...encodeCharacters(string));
    }
    await this.sendStringOfType(5 /* String */, string);
  }
  async sendObject(obj) {
    const str = JSON.stringify(obj);
    if (str.length <= 3) {
      return await this.sendHeader(7 /* SmallObject */, ...encodeCharacters(str));
    }
    await this.sendStringOfType(6 /* Object */, str);
  }
  async sendStringOfType(type, string) {
    const codes = encodeCharacters(string);
    await this.sendSpreadBytes(type, codes);
  }
  async sendSpreadBytes(type, bytes) {
    const messages = [];
    for (let i = 3; i < bytes.length; i += 7) {
      messages.push(bytes.slice(i, i + 7));
    }
    const lastMessage = messages.at(-1);
    const lastIndex = lastMessage.length + 1;
    await Promise.all([
      this.sendHeader(type, ...bytes.slice(0, 3)),
      ...messages.slice(0, -1).map((msg) => _AimingMessenger.sendAlternatedBytes(msg)),
      _AimingMessenger.sendAlternatedBytes(lastMessage, lastIndex)
    ]);
  }
  // Maxmium of 3 free bytes
  async sendHeader(type, ...free) {
    const header = [...this.identifierBytes, ...free];
    header[7] = type;
    _AimingMessenger.alternate = !_AimingMessenger.alternate;
    if (_AimingMessenger.alternate) header[7] |= 128;
    await _AimingMessenger.sendBytes(header);
  }
  // Maxmium of 7 bytes
  static async sendAlternatedBytes(bytes, overrideLast) {
    if (overrideLast) {
      bytes[7] = overrideLast;
    } else {
      this.alternate = !this.alternate;
      if (this.alternate) bytes[7] = 1;
    }
    await this.sendBytes(bytes);
  }
  static async sendBytes(bytes) {
    await this.sendAngle(bytesToFloat(bytes));
  }
  static sendAngle(angle) {
    const resolvers = Promise.withResolvers();
    this.angleQueue.push({
      angle,
      resolvers
    });
    if (this.angleQueue.length === 1) this.processQueue();
    return resolvers.promise;
  }
  static async processQueue() {
    while (this.angleQueue.length > 0) {
      const queuedAngle = this.angleQueue[0];
      this.ignoreNextAngle = true;
      api.net.colyseus.send("AIMING", { angle: queuedAngle.angle });
      try {
        await this.awaitAngleChange();
      } catch {
        break;
      }
      queuedAngle.resolvers.resolve();
      this.angleQueue.shift();
    }
    if (!this.realAngle) return;
    api.net.colyseus.send("AIMING", { angle: this.realAngle });
  }
  static async awaitAngleChange() {
    return new Promise((res, rej) => {
      this.angleChangeRes = res;
      this.angleChangeRej = rej;
    });
  }
  static handleBytes(char, bytes) {
    const state = this.messageState.get(char);
    if (state) {
      const payload2 = bytes.slice(0, 7);
      const flag = bytes[7];
      const done = flag >= 2;
      const data = done ? payload2.slice(0, flag - 1) : payload2;
      state.bytes.push(...data);
      if (Streamer.updateCallbacks.has(char)) {
        Streamer.onStreamData(char, data, done);
      }
      if (!done) return;
      if (state.type === 3 /* Float */) {
        Streamer.onMessage(state.identifier, bytesToFloat(state.bytes), char);
      } else if (state.type === 5 /* String */) {
        Streamer.onMessage(state.identifier, String.fromCharCode(...state.bytes), char);
      } else if (state.type === 11 /* SeveralBytes */) {
        Streamer.onMessage(state.identifier, state.bytes, char);
      } else if (state.type === 6 /* Object */) {
        try {
          const value = JSON.parse(String.fromCharCode(...state.bytes));
          Streamer.onMessage(state.identifier, value, char);
        } catch (e) {
          api.logger.error("Failed to parse JSON object", e);
        }
      }
      this.messageState.delete(char);
      return;
    }
    const payload = bytes.slice(4, 7);
    const type = bytes[7] & 127;
    const identifier = joinUint32(bytes.slice(0, 4));
    const callbacks = Streamer.callbacks.get(identifier);
    if (!callbacks) return;
    const gotValue = (value) => {
      Streamer.onMessage(identifier, value, char);
    };
    switch (type) {
      case 0 /* Boolean */:
        gotValue(payload[0] === 1);
        return;
      case 1 /* PositiveInt24 */:
        gotValue(joinUint24(...payload));
        return;
      case 2 /* NegativeInt24 */:
        gotValue(-joinUint24(...payload));
        return;
      case 8 /* Byte */: {
        const bytes2 = [payload[0]];
        Streamer.startStream(callbacks.byteStream, char, bytes2, true);
        gotValue(bytes2);
        return;
      }
      case 9 /* TwoBytes */: {
        const bytes2 = payload.slice(0, 2);
        Streamer.startStream(callbacks.byteStream, char, bytes2, true);
        gotValue(bytes2);
        return;
      }
      case 10 /* ThreeBytes */: {
        Streamer.startStream(callbacks.byteStream, char, payload, true);
        gotValue(payload);
        return;
      }
      case 4 /* ThreeCharacters */: {
        const codes = payload.filter((b) => b !== 0);
        Streamer.startStream(callbacks.stringStream, char, codes, true, String.fromCharCode);
        gotValue(String.fromCharCode(...codes));
        return;
      }
      case 7 /* SmallObject */: {
        const codes = payload.filter((b) => b !== 0);
        gotValue(JSON.parse(String.fromCharCode(...codes)));
        return;
      }
      case 3 /* Float */:
      case 6 /* Object */: {
        this.messageState.set(char, { identifier, type, bytes: payload });
        return;
      }
      case 11 /* SeveralBytes */: {
        Streamer.startStream(callbacks.byteStream, char, payload, false);
        this.messageState.set(char, { identifier, type, bytes: payload });
        return;
      }
      case 5 /* String */: {
        Streamer.startStream(callbacks.stringStream, char, payload, false, String.fromCharCode);
        this.messageState.set(char, { identifier, type, bytes: payload });
        return;
      }
    }
  }
};

// libraries/Communication/src/messengers/stickers.ts
function codeToSticker(code) {
  return {
    placement: placements[code % 3],
    size: sizes[Math.floor(code / 3)]
  };
}
function awaitBackToLobby() {
  return new Promise((res) => {
    const unsub = api.net.colyseus.state.session.listen("loadingPhase", (loading) => {
      if (loading) return;
      unsub();
      res();
    }, false);
  });
}
async function getOwnedSticker() {
  const res = await fetch("/api/cosmos/owned-stickers");
  if (!res.ok) return null;
  const json = await res.json();
  const sticker = json[0];
  if (!sticker) return null;
  return sticker.id;
}
var StickerMessenger = class _StickerMessenger {
  // TODO: Communicate with multiple stickers
  constructor(identifierDozens) {
    this.identifierDozens = identifierDozens;
  }
  static initialStickerPromise;
  static stickerQueue = [];
  static pendingStickers = [];
  static lastStickerWait = 0;
  static stickersSentAfterLastWait = 0;
  static characterYHistory = /* @__PURE__ */ new WeakMap();
  static stickerCodeBuffers = /* @__PURE__ */ new WeakMap();
  static streamState = /* @__PURE__ */ new WeakMap();
  static resetStateTimeouts = /* @__PURE__ */ new Map();
  static ownedStickerPromise = getOwnedSticker();
  static ownedSticker = null;
  static initNet() {
    let loaded = false;
    api.net.onLoad(() => {
      loaded = true;
    });
    api.net.colyseus.on("WORLD_CHANGES", (data) => {
      if (loaded) {
        this.handleAddedDevices(data.devices.addedDevices);
      }
      this.removeStickers(data.devices.addedDevices);
    });
  }
  static init() {
    this.ownedStickerPromise.then((sticker) => this.ownedSticker = sticker);
    api.onStop(
      api.net.colyseus.state.characters.onAdd((char) => {
        if (char.id === api.stores.network.authId) return;
        const history = [];
        this.characterYHistory.set(char, history);
        api.onStop(
          char.listen("y", (y) => {
            if (history.length >= 20) history.shift();
            history.push(y);
          })
        );
      })
    );
  }
  static reset() {
    for (const message of this.stickerQueue) message.resolvers.reject();
    for (const pending of this.pendingStickers) pending.resolvers.resolve();
    for (const timeout of this.resetStateTimeouts.values()) clearTimeout(timeout);
    this.resetStateTimeouts.clear();
    this.stickerQueue.length = 0;
    this.pendingStickers.length = 0;
  }
  static handleAddedDevices(addedDevices) {
    if (addedDevices.devices.length === 0) return;
    const getValue = (index) => addedDevices.values[index];
    const incomingStickerBuffers = /* @__PURE__ */ new Map();
    for (const device of addedDevices.devices) {
      const y = device[2], deviceOptionIdIndex = device[5], optionIndexes = device[6];
      const deviceOptionId = getValue(deviceOptionIdIndex);
      if (deviceOptionId !== "placedSticker") continue;
      const options = {};
      for (const [propertyIndex, valueIndex] of optionIndexes) {
        options[getValue(propertyIndex)] = getValue(valueIndex);
      }
      if (options.placedByCharacterId === api.stores.network.authId) {
        const firstPendingMessage = this.pendingStickers[0];
        if (!firstPendingMessage) continue;
        if (--firstPendingMessage.amount) continue;
        this.pendingStickers.shift();
        firstPendingMessage.resolvers.resolve();
        continue;
      }
      if (!incomingStickerBuffers.has(options.placedByCharacterId)) {
        incomingStickerBuffers.set(options.placedByCharacterId, []);
      }
      const placement = this.getPlacement(options.placedByCharacterId, y);
      const buffer = incomingStickerBuffers.get(options.placedByCharacterId);
      buffer.push(sizeNumbers.indexOf(options.scale) * 3 + placement);
    }
    for (const [characterId, buffer] of incomingStickerBuffers) {
      this.appendCharacterBuffer(characterId, buffer);
    }
  }
  static removeStickers = (addedDevices) => {
    addedDevices.devices = addedDevices.devices.filter((d) => addedDevices.values[d[5]] !== "placedSticker");
  };
  static appendCharacterBuffer(characterId, newBuffer) {
    const char = api.net.colyseus.state.characters.get(characterId);
    if (!char) return;
    this.stickersSentAfterLastWait += newBuffer.length;
    if (newBuffer.length === 1) {
      const buffer2 = this.stickerCodeBuffers.get(char);
      if (buffer2 && buffer2.length <= 1) {
        this.stickerCodeBuffers.delete(char);
      }
    }
    if (!this.stickerCodeBuffers.has(char)) {
      this.stickerCodeBuffers.set(char, []);
    }
    const buffer = this.stickerCodeBuffers.get(char);
    buffer.push(...newBuffer);
    while (buffer.length > 0) {
      const consumed = this.readMessageFromBuffer(char, buffer);
      if (!consumed) break;
      buffer.splice(0, consumed);
    }
    const timeout = this.resetStateTimeouts.get(char);
    if (timeout) clearTimeout(timeout);
    if (buffer.length > 0) {
      this.resetStateTimeouts.set(
        char,
        setTimeout(() => {
          this.stickerCodeBuffers.delete(char);
          this.resetStateTimeouts.delete(char);
          this.streamState.delete(char);
          api.logger.warn("Reset state for", characterId, "after 2s of inactivity");
        }, 2e3)
      );
    }
  }
  static readMessageFromBuffer(char, buffer) {
    const streamState = this.streamState.get(char);
    if (!streamState) {
      const identifiers = Streamer.callbacks.keys();
      for (const identifier2 of identifiers) {
        const dozens = numberToDozens(identifier2, stickerIdentifierLength);
        const index = indexOfSubarray(buffer, dozens);
        if (index === -1) continue;
        buffer.splice(0, index);
        break;
      }
    }
    if (streamState) {
      const done2 = buffer.length >= streamState.remainingDozens;
      const dozens = buffer.slice(0, streamState.remainingDozens);
      const { result, state } = dozensToBytes(dozens, streamState.decodeState);
      streamState.bytes.push(...result);
      if (Streamer.updateCallbacks.has(char)) {
        Streamer.onStreamData(char, result, done2);
      }
      if (!done2) {
        streamState.remainingDozens -= buffer.length;
        streamState.decodeState = state;
        return buffer.length;
      }
      if (streamState.type === 8 /* Bytes */) {
        Streamer.onMessage(streamState.identifier, streamState.bytes, char);
      } else if (streamState.type === 6 /* String */) {
        Streamer.onMessage(streamState.identifier, String.fromCharCode(...streamState.bytes), char);
      } else if (streamState.type === 7 /* Object */) {
        try {
          const value = JSON.parse(String.fromCharCode(...streamState.bytes));
          Streamer.onMessage(streamState.identifier, value, char);
        } catch (e) {
          api.logger.log("Failed to parse JSON message", e);
        }
      }
      this.streamState.delete(char);
      return dozens.length;
    }
    const lengthWithId = stickerIdentifierLength + 1;
    if (buffer.length < lengthWithId + 1) return;
    const identifierDozens = buffer.slice(0, stickerIdentifierLength);
    const identifier = dozensToNumber(identifierDozens);
    const callbacks = Streamer.callbacks.get(identifier);
    const payload = buffer.slice(stickerIdentifierLength + 1);
    const gotValue = (value) => {
      Streamer.onMessage(identifier, value, char);
    };
    const type = buffer[stickerIdentifierLength];
    switch (type) {
      case 5 /* Boolean */:
        gotValue(payload[0] === 1);
        return lengthWithId + 1;
      case 4 /* Float */:
        if (payload.length < 18) return;
        gotValue(dozensToFloat(payload.slice(0, 18)));
        return lengthWithId + 18;
      case 0 /* PositiveDozen */:
        gotValue(payload[0]);
        return lengthWithId + 1;
      case 1 /* PositiveTwoDozen */:
        if (payload.length < 2) return;
        gotValue(dozensToNumber(payload.slice(0, 2)));
        return lengthWithId + 2;
      case 2 /* PositiveInt */:
      case 3 /* NegativeInt */: {
        const length = payload[0];
        if (payload.length < 1 + length) return;
        const number = dozensToNumber(payload.slice(1, length + 1));
        gotValue(type === 2 /* PositiveInt */ ? number : -number);
        return lengthWithId + length + 1;
      }
    }
    if (payload.length < stickerMessageSizeLength) return;
    const size = dozensToNumber(payload.slice(0, stickerMessageSizeLength));
    const done = size <= payload.length - stickerMessageSizeLength;
    const streamPayload = payload.slice(stickerMessageSizeLength, size + stickerMessageSizeLength);
    const decoded = dozensToBytes(streamPayload);
    if (!done) {
      this.streamState.set(char, {
        remainingDozens: size - streamPayload.length,
        decodeState: decoded.state,
        bytes: decoded.result,
        type,
        identifier
      });
    }
    if (callbacks) {
      if (type === 8 /* Bytes */) {
        Streamer.startStream(callbacks.byteStream, char, decoded.result, done);
      } else if (type === 6 /* String */) {
        Streamer.startStream(callbacks.stringStream, char, decoded.result, done, String.fromCharCode);
      }
    }
    if (!done) return buffer.length;
    switch (type) {
      case 8 /* Bytes */: {
        gotValue(decoded.result);
        break;
      }
      case 6 /* String */: {
        gotValue(String.fromCharCode(...decoded.result));
        break;
      }
      case 7 /* Object */: {
        const string = String.fromCharCode(...decoded.result);
        try {
          gotValue(JSON.parse(string));
        } catch (e) {
          api.logger.error("Failed to parse object message:", e);
        }
        break;
      }
    }
    return lengthWithId + stickerMessageSizeLength + size;
  }
  static getPlacement(characterId, stickerY) {
    const char = api.net.colyseus.state.characters.get(characterId);
    if (!char) throw new Error(`Could not find player ${characterId}`);
    const history = this.characterYHistory.get(char);
    if (!history) throw new Error("y history not found");
    for (let i = history.length - 1; i >= 0; i--) {
      const y = history[i];
      const difference = stickerY - y;
      if (difference === 50) {
        history.splice(0, i);
        return 0;
      } else if (difference === -10) {
        history.splice(0, i);
        return 1;
      } else if (difference === -60) {
        history.splice(0, i);
        return 2;
      }
    }
    throw new Error("Placement not found");
  }
  async send(message) {
    switch (typeof message) {
      case "number":
        if (Number.isInteger(message) && message < maxDozensInt && message > -maxDozensInt) {
          if (message < 0) return await this.sendNegativeInteger(message);
          else if (message < 12) return await this.sendIntUnderDozen(message);
          else if (message < 12 ** 2) return await this.sendIntUnderTwoDozen(message);
          else return await this.sendPositiveInteger(message);
        } else {
          return await this.sendFloat(message);
        }
      case "string":
        return await this.sendString(message);
      case "boolean":
        return await this.sendBoolean(message);
      case "object":
        if (Array.isArray(message) && message.every((element) => typeof element === "number") && message.every(isUint8) && message.length > 0) {
          return await this.sendBytes(message);
        } else {
          return await this.sendObject(message);
        }
      default:
        throw new Error(`Cannot send message of type ${typeof message}`);
    }
  }
  async sendBoolean(value) {
    await this.sendDozens(5 /* Boolean */, [value ? 1 : 0]);
  }
  async sendIntUnderDozen(value) {
    await this.sendDozens(0 /* PositiveDozen */, [value]);
  }
  async sendIntUnderTwoDozen(value) {
    const dozens = numberToDozens(value, 2);
    await this.sendDozens(1 /* PositiveTwoDozen */, dozens);
  }
  async sendPositiveInteger(value) {
    await this.sendIntegerOfType(value, 2 /* PositiveInt */);
  }
  async sendNegativeInteger(value) {
    await this.sendIntegerOfType(-value, 3 /* NegativeInt */);
  }
  async sendIntegerOfType(value, type) {
    const size = Math.ceil(Math.log(value) / Math.log(12));
    const dozens = numberToDozens(value, size);
    await this.sendDozens(type, [size, ...dozens]);
  }
  async sendFloat(value) {
    await this.sendDozens(4 /* Float */, floatToDozens(value));
  }
  async sendString(value) {
    await this.sendStringOfType(value, 6 /* String */);
  }
  async sendObject(value) {
    const str = JSON.stringify(value);
    await this.sendStringOfType(str, 7 /* Object */);
  }
  async sendStringOfType(value, type) {
    const encodedCharacters = encodeCharacters(value);
    await this.sendEncodedBytes(type, encodedCharacters);
  }
  async sendBytes(value) {
    await this.sendEncodedBytes(8 /* Bytes */, value);
  }
  async sendEncodedBytes(type, bytes) {
    const payloadDozens = bytesToDozens(bytes);
    if (payloadDozens.length > maxStickerMessageLength) {
      throw new RangeError(`Message is too long (cannot encode to over ${payloadDozens} dozens)`);
    }
    const length = numberToDozens(payloadDozens.length, stickerMessageSizeLength);
    const stickerCodes = [...this.identifierDozens, type, ...length, ...payloadDozens];
    await this.sendStickerCodes(stickerCodes);
  }
  async sendDozens(type, dozens) {
    await this.sendStickerCodes([...this.identifierDozens, type, ...dozens]);
  }
  async sendStickerCodes(codes) {
    if (_StickerMessenger.initialStickerPromise) {
      await _StickerMessenger.initialStickerPromise;
      await this.sendStickers(codes);
      return;
    }
    await this.sendStickers([codes[0]]);
    _StickerMessenger.initialStickerPromise = _StickerMessenger.pendingStickers.at(-1)?.resolvers.promise;
    await _StickerMessenger.initialStickerPromise;
    await this.sendStickers(codes.slice(1));
  }
  sendStickers(stickerCodes) {
    return new Promise((res, rej) => {
      const resolvers = Promise.withResolvers();
      _StickerMessenger.stickerQueue.push({
        resolvers,
        stickerCodes
      });
      if (_StickerMessenger.stickerQueue.length === 1) _StickerMessenger.processQueue();
      resolvers.promise.then(res, rej);
    });
  }
  static async processQueue() {
    const now = Date.now();
    this.lastStickerWait ||= now;
    if (now - this.lastStickerWait >= stickerWait) {
      this.stickersSentAfterLastWait = 0;
      this.lastStickerWait = now;
    }
    while (this.stickerQueue.length > 0) {
      let stickerRoom = maxStickersBeforeWait - this.stickersSentAfterLastWait;
      if (stickerRoom <= 0) {
        await this.pendingStickers.at(-1)?.resolvers.promise;
        await new Promise((res) => setTimeout(res, stickerWait));
        this.lastStickerWait = Date.now();
        this.stickersSentAfterLastWait = 0;
        stickerRoom = maxStickersBeforeWait;
      }
      if (api.net.colyseus.state.session.loadingPhase) {
        await awaitBackToLobby();
      }
      const queued = this.stickerQueue[0];
      if (!queued) return;
      const stickerAmount = Math.min(queued.stickerCodes.length, stickerRoom);
      for (const stickerCode of queued.stickerCodes.slice(0, stickerAmount)) {
        const stickerData = codeToSticker(stickerCode);
        api.net.colyseus.send("PLACE_STICKER", {
          stickerId: this.ownedSticker,
          ...stickerData
        });
      }
      this.stickersSentAfterLastWait += stickerAmount;
      this.pendingStickers.push({
        amount: stickerAmount,
        resolvers: Promise.withResolvers()
      });
      if (stickerAmount === queued.stickerCodes.length) {
        this.stickerQueue.shift();
        queued.resolvers.resolve();
      } else {
        queued.stickerCodes.splice(0, stickerAmount);
      }
    }
  }
};

// libraries/Communication/src/util.ts
function splicer(array, obj) {
  array.push(obj);
  return () => {
    const index = array.indexOf(obj);
    if (index !== -1) array.splice(index, 1);
  };
}

// libraries/Communication/src/index.ts
var EnabledManager = class {
  static onEnabledCallbacks = /* @__PURE__ */ new Set();
  static lastEnabled = false;
  static stickerResolved = false;
  static ready = StickerMessenger.ownedStickerPromise.then(() => {
  }, () => {
  });
  static init() {
    api.net.colyseus.state.session.listen("phase", () => this.handlePotentialEnabledChange(false));
    this.ready.then(() => this.handlePotentialEnabledChange(true));
  }
  static handlePotentialEnabledChange(afterReady) {
    const enabled = this.enabled;
    const lastEnabled = this.lastEnabled;
    if (enabled === lastEnabled) return;
    this.lastEnabled = enabled;
    for (const cb of this.onEnabledCallbacks) {
      cb(enabled, afterReady);
    }
  }
  static get enabled() {
    if (api.net.type !== "Colyseus") return false;
    return api.net.colyseus.state.session.phase === "game" || Boolean(StickerMessenger.ownedSticker);
  }
  static onEnabledChanged(callback) {
    this.onEnabledCallbacks.add(callback);
    return () => {
      this.onEnabledCallbacks.delete(callback);
    };
  }
};
api.net.onLoad(() => {
  AimingMessenger.init();
  StickerMessenger.init();
  EnabledManager.init();
  api.net.colyseus.state.session.listen("phase", (phase) => {
    if (phase === "game") StickerMessenger.reset();
    else AimingMessenger.reset();
    Streamer.updateCallbacks.clear();
  }, false);
});
StickerMessenger.initNet();
var Communication = class _Communication {
  static #queue = [];
  #aimingMessenger;
  #stickerMessenger;
  #streamer;
  #onDisabledCallbacks = [];
  static get enabled() {
    return EnabledManager.enabled;
  }
  get enabled() {
    return EnabledManager.enabled;
  }
  constructor(name) {
    const identifier = getIdentifier(name);
    this.#streamer = new Streamer(identifier);
    this.#aimingMessenger = new AimingMessenger(identifierToBytes(identifier));
    this.#stickerMessenger = new StickerMessenger(identifierToDozens(identifier));
  }
  onEnabledChanged(callback) {
    return EnabledManager.onEnabledChanged(callback);
  }
  send(message) {
    const resolvers = Promise.withResolvers();
    _Communication.#queue.push({
      aimingMessenger: this.#aimingMessenger,
      stickerMessenger: this.#stickerMessenger,
      message,
      resolvers
    });
    if (_Communication.#queue.length === 1) _Communication.#processQueue();
    return resolvers.promise;
  }
  static async #processQueue() {
    while (this.#queue.length > 0) {
      const players = [...api.net.colyseus.state.characters.values()].filter((char) => char.type === "player");
      if (players.length === 0) {
        for (const item of this.#queue) item.resolvers.resolve();
        this.#queue.length = 0;
        return;
      }
      const queued = this.#queue[0];
      if (!queued) return;
      try {
        if (api.net.colyseus.state.session.phase === "preGame") {
          await queued.stickerMessenger.send(queued.message);
        } else {
          await queued.aimingMessenger.send(queued.message);
        }
      } catch {
        if (queued.retried) {
          api.logger.error("Failed to send", queued.message, "after retry, giving up");
          queued.resolvers.reject();
          this.#queue.shift();
        } else {
          api.logger.error("Failed to send", queued.message, "retrying...");
          queued.retried = true;
          await new Promise((res) => setTimeout(res, 500));
        }
        continue;
      }
      queued.resolvers.resolve();
      this.#queue.shift();
    }
  }
  onMessage(callback) {
    return splicer(this.#streamer.callbacks.message, callback);
  }
  onStringStream(callback) {
    return splicer(this.#streamer.callbacks.stringStream, callback);
  }
  onByteStream(callback) {
    return splicer(this.#streamer.callbacks.byteStream, callback);
  }
  destroy() {
    this.#streamer.destroy();
    this.#onDisabledCallbacks.forEach((cb) => cb());
  }
};
export {
  Communication as default
};
