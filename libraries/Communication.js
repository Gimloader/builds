/**
 * @name Communication
 * @description Communication between different clients in 2D gamemodes
 * @author retrozy
 * @version 0.5.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/builds/main/libraries/Communication.js
 * @webpage https://gimloader.github.io/libraries/Communication
 * @gamemode 2d
 * @changelog Added support for streaming strings and byte arrays
 * @isLibrary true
 */

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
function getIdentifier(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hash = hash * 31 + charCode | 0;
  }
  const uInt32Hash = hash >>> 0;
  return [
    uInt32Hash >>> 24 & 255,
    uInt32Hash >>> 16 & 255,
    uInt32Hash >>> 8 & 255,
    uInt32Hash & 255
  ];
}
function encodeCharacters(characters) {
  return characters.split("").map((c) => c.charCodeAt(0)).filter((c) => c < 256 && c > 0);
}

// libraries/Communication/src/messenger.ts
var Messenger = class _Messenger {
  constructor(identifier) {
    this.identifier = identifier;
  }
  static pendingAngle = 0;
  static angleChangeRes = null;
  static angleChangeRej = null;
  static angleQueue = [];
  static callbacks = /* @__PURE__ */ new Map();
  static alternate = false;
  static ignoreNextAngle = false;
  static init() {
    api.net.on("send:AIMING", (message, editFn) => {
      if (this.ignoreNextAngle) {
        this.ignoreNextAngle = false;
        return;
      }
      this.pendingAngle = message.angle;
      if (this.angleQueue.length > 0) editFn(null);
    });
    api.net.state.session.listen("phase", (phase) => {
      if (phase === "game") return;
      this.angleQueue.forEach((pending) => pending.reject());
      this.angleQueue.length = 0;
      this.angleChangeRej?.();
      this.updatePromises.clear();
      this.updateResolvers.clear();
    }, false);
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
  async sendNumber(value) {
    const bytes = floatToBytes(value);
    await this.sendSpreadBytes(3 /* Float */, bytes);
  }
  async sendByte(byte) {
    await this.sendHeader(8 /* Byte */, byte);
  }
  async sendTwoBytes(bytes) {
    await this.sendHeader(9 /* TwoBytes */, ...bytes);
  }
  async sendThreeBytes(bytes) {
    await this.sendHeader(10 /* ThreeBytes */, ...bytes);
  }
  async sendSeveralBytes(bytes) {
    await this.sendSpreadBytes(11 /* SeveralBytes */, bytes);
  }
  async sendThreeCharacters(string) {
    const codes = encodeCharacters(string);
    await this.sendHeader(4 /* ThreeCharacters */, ...codes);
  }
  async sendString(string) {
    await this.sendStringOfType(string, 5 /* String */);
  }
  async sendSmallObject(string) {
    await this.sendHeader(7 /* SmallObject */, ...encodeCharacters(string));
  }
  async sendObject(string) {
    await this.sendStringOfType(string, 6 /* Object */);
  }
  async sendStringOfType(string, type) {
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
      ...messages.slice(0, -1).map((msg) => _Messenger.sendAlternatedBytes(msg)),
      _Messenger.sendAlternatedBytes(lastMessage, lastIndex)
    ]);
  }
  // Maxmium of 3 free bytes
  async sendHeader(type, ...free) {
    const header = [...this.identifier, ...free];
    header[7] = type;
    _Messenger.alternate = !_Messenger.alternate;
    if (_Messenger.alternate) header[7] |= 128;
    await _Messenger.sendBytes(header);
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
  static async sendAngle(angle) {
    return new Promise((res, rej) => {
      this.angleQueue.push({
        angle,
        resolve: res,
        reject: rej
      });
      if (this.angleQueue.length > 1) return;
      this.processQueue();
    });
  }
  static async processQueue() {
    while (this.angleQueue.length > 0) {
      const queuedAngle = this.angleQueue[0];
      this.ignoreNextAngle = true;
      api.net.send("AIMING", { angle: queuedAngle.angle });
      try {
        await this.awaitAngleChange();
      } catch {
        break;
      }
      queuedAngle.resolve();
      this.angleQueue.shift();
    }
    if (!this.pendingAngle) return;
    api.net.send("AIMING", { angle: this.pendingAngle });
  }
  static async awaitAngleChange() {
    return new Promise((res, rej) => {
      this.angleChangeRes = res;
      this.angleChangeRej = rej;
    });
  }
  static updatePromises = /* @__PURE__ */ new Map();
  static updateResolvers = /* @__PURE__ */ new Map();
  static async *restOfBytes(char) {
    while (true) {
      const update = await _Messenger.nextBytes(char);
      yield update.data;
      if (update.done) break;
    }
  }
  static async getMessageBytes(char, initial) {
    const array = [...initial];
    for await (const chunk of _Messenger.restOfBytes(char)) {
      array.push(...chunk);
    }
    return array;
  }
  static nextBytes(char) {
    const existing = this.updatePromises.get(char);
    if (existing) return existing;
    const { promise, resolve } = Promise.withResolvers();
    this.updatePromises.set(char, promise);
    this.updateResolvers.set(char, resolve);
    return promise;
  }
  static async handleAngle(char, angle) {
    if (!angle) return;
    if (char.id === api.stores.network.authId) return this.angleChangeRes?.();
    const bytes = floatToBytes(angle);
    const resolve = this.updateResolvers.get(char);
    if (resolve) {
      const payload2 = bytes.slice(0, 7);
      const flag = bytes[7];
      const done = flag >= 2;
      if (done) resolve({ done, data: payload2.slice(0, flag - 1) });
      else resolve({ done, data: payload2 });
      this.updatePromises.delete(char);
      this.updateResolvers.delete(char);
      return;
    }
    const identifierBytes = bytes.slice(0, 4);
    const payload = bytes.slice(4, 7);
    const type = bytes[7] & 127;
    const identifierString = identifierBytes.join(",");
    const callbacks = this.callbacks.get(identifierString);
    if (!callbacks) return;
    const gotValue = (value) => {
      callbacks.message.forEach((callback) => {
        callback(value, char);
      });
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
        this.startCompletedStream(callbacks.byteStream, char, bytes2);
        gotValue(bytes2);
        return;
      }
      case 9 /* TwoBytes */: {
        const bytes2 = payload.slice(0, 2);
        this.startCompletedStream(callbacks.byteStream, char, bytes2);
        gotValue(bytes2);
        return;
      }
      case 10 /* ThreeBytes */: {
        this.startCompletedStream(callbacks.byteStream, char, payload);
        gotValue(payload);
        return;
      }
      case 4 /* ThreeCharacters */: {
        const codes = payload.filter((b) => b !== 0);
        const string = String.fromCharCode(...codes);
        this.startCompletedStream(callbacks.stringStream, char, string);
        gotValue(string);
        return;
      }
      case 7 /* SmallObject */: {
        const codes = payload.filter((b) => b !== 0);
        gotValue(JSON.parse(String.fromCharCode(...codes)));
        return;
      }
      case 3 /* Float */: {
        const bytes2 = await this.getMessageBytes(char, payload);
        gotValue(bytesToFloat(bytes2));
        return;
      }
      case 11 /* SeveralBytes */: {
        this.startStream(callbacks.byteStream, char, payload);
        const bytes2 = await this.getMessageBytes(char, payload);
        gotValue(bytes2);
        return;
      }
      case 5 /* String */: {
        this.startStream(callbacks.stringStream, char, payload, String.fromCharCode);
        const bytes2 = await this.getMessageBytes(char, payload);
        gotValue(String.fromCharCode(...bytes2));
        return;
      }
      case 6 /* Object */: {
        const bytes2 = await this.getMessageBytes(char, payload);
        const string = String.fromCharCode(...bytes2);
        try {
          gotValue(JSON.parse(string));
        } catch (e) {
          console.error("Failed to parse object message:", e);
        }
        return;
      }
    }
  }
  static startCompletedStream(callbacks, char, initial) {
    const generator = async function* () {
      yield initial;
    };
    for (const cb of callbacks) {
      cb(generator(), char);
    }
  }
  static startStream(callbacks, char, initial, map) {
    const generator = async function* () {
      yield map ? map(...initial) : initial;
      for await (const chunk of _Messenger.restOfBytes(char)) {
        yield map ? map(...chunk) : chunk;
      }
    };
    for (const cb of callbacks) {
      cb(generator(), char);
    }
  }
};

// libraries/Communication/src/index.ts
api.net.onLoad(() => {
  Messenger.init();
  api.onStop(api.net.state.characters.onAdd((char) => {
    api.onStop(
      char.projectiles.listen("aimAngle", (angle) => {
        Messenger.handleAngle(char, angle);
      })
    );
  }));
});
var Communication = class _Communication {
  #identifierString;
  #onDisabledCallbacks = [];
  #messenger;
  constructor(name) {
    const identifier = getIdentifier(name);
    this.#identifierString = identifier.join(",");
    this.#messenger = new Messenger(identifier);
  }
  get #callbacks() {
    if (!Messenger.callbacks.has(this.#identifierString)) {
      Messenger.callbacks.set(this.#identifierString, {
        message: [],
        stringStream: [],
        byteStream: []
      });
    }
    return Messenger.callbacks.get(this.#identifierString);
  }
  static get enabled() {
    return api.net.state?.session.phase === "game";
  }
  onEnabledChanged(callback) {
    const unsub = api.net.state.session.listen("phase", (phase) => {
      callback(phase === "game");
    }, false);
    this.#onDisabledCallbacks.push(unsub);
    return unsub;
  }
  async send(message) {
    if (!_Communication.enabled) {
      throw new Error("Communication can only be used after the game is started");
    }
    const players = [...api.net.state.characters.values()].filter((char) => char.type === "player");
    if (players.length <= 1) return;
    switch (typeof message) {
      case "number": {
        if (isUint24(message)) {
          return await this.#messenger.sendPositiveInt24(message);
        } else if (isUint24(-message)) {
          return await this.#messenger.sendNegativeInt24(message);
        } else {
          return await this.#messenger.sendNumber(message);
        }
      }
      case "string": {
        if (message.length <= 3) {
          return await this.#messenger.sendThreeCharacters(message);
        } else {
          return await this.#messenger.sendString(message);
        }
      }
      case "boolean": {
        return await this.#messenger.sendBoolean(message);
      }
      case "object": {
        if (Array.isArray(message) && message.every((element) => typeof element === "number") && message.every(isUint8) && message.length > 0) {
          if (message.length === 1) {
            return await this.#messenger.sendByte(message[0]);
          } else if (message.length === 2) {
            return await this.#messenger.sendTwoBytes(message);
          } else if (message.length === 3) {
            return await this.#messenger.sendThreeBytes(message);
          } else if (message.length > 3) {
            return await this.#messenger.sendSeveralBytes(message);
          }
        } else {
          const stringified = JSON.stringify(message);
          if (stringified.length <= 3) {
            return await this.#messenger.sendSmallObject(stringified);
          }
          return await this.#messenger.sendObject(stringified);
        }
      }
    }
  }
  onMessage(callback) {
    const cb = callback;
    this.#callbacks.message.push(cb);
    return () => {
      const index = this.#callbacks.message.indexOf(cb);
      if (index !== -1) this.#callbacks.message.slice(index, 1);
    };
  }
  onStringStream(callback) {
    this.#callbacks.stringStream.push(callback);
    return () => {
      const index = this.#callbacks.stringStream.indexOf(callback);
      if (index !== -1) this.#callbacks.stringStream.slice(index, 1);
    };
  }
  onByteStream(callback) {
    this.#callbacks.byteStream.push(callback);
    return () => {
      const index = this.#callbacks.byteStream.indexOf(callback);
      if (index !== -1) this.#callbacks.byteStream.slice(index, 1);
    };
  }
  destroy() {
    Messenger.callbacks.delete(this.#identifierString);
    this.#onDisabledCallbacks.forEach((cb) => cb());
  }
};
export {
  Communication as default
};
