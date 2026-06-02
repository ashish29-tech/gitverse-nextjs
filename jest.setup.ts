import '@testing-library/jest-dom';

const { TextEncoder, TextDecoder } = require("util");
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

const { ReadableStream } = require("node:stream/web");
(global as any).ReadableStream = ReadableStream;

const undici = require("undici");
(global as any).Request = undici.Request;
(global as any).Response = undici.Response;
(global as any).Headers = undici.Headers;

