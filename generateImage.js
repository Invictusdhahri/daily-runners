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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var canvas_1 = require("canvas");
var fs = require("fs");
var main_1 = require("../trending-tokens/main");
var WIDTH = 600;
var HEIGHT = 700;
var ITEM_HEIGHT = 120;
var PADDING = 30;
var IMAGE_SIZE = 60;
var BG_COLOR = '#101014';
var CARD_COLOR = '#18181c';
var TEXT_COLOR = '#fff';
var SUBTEXT_COLOR = '#aaa';
var GREEN = '#2ecc40';
function drawTrendingTokensImage() {
    return __awaiter(this, void 0, void 0, function () {
        var canvas, ctx, tokens, i, y, token, img, _a, out, stream;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    canvas = (0, canvas_1.createCanvas)(WIDTH, HEIGHT);
                    ctx = canvas.getContext('2d');
                    // Background
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, WIDTH, HEIGHT);
                    // Card
                    ctx.fillStyle = CARD_COLOR;
                    ctx.save();
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 30;
                    ctx.beginPath();
                    ctx.moveTo(PADDING, PADDING + 20);
                    ctx.arcTo(WIDTH - PADDING, PADDING, WIDTH - PADDING, HEIGHT - PADDING, 40);
                    ctx.arcTo(WIDTH - PADDING, HEIGHT - PADDING, PADDING, HEIGHT - PADDING, 40);
                    ctx.arcTo(PADDING, HEIGHT - PADDING, PADDING, PADDING, 40);
                    ctx.arcTo(PADDING, PADDING, WIDTH - PADDING, PADDING, 40);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    // Title
                    ctx.font = 'bold 36px Arial';
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.fillText('Trending Tokens', PADDING + 20, PADDING + 50);
                    return [4 /*yield*/, (0, main_1.default)()];
                case 1:
                    tokens = (_b.sent()).slice(0, 5);
                    i = 0;
                    _b.label = 2;
                case 2:
                    if (!(i < tokens.length)) return [3 /*break*/, 9];
                    y = PADDING + 80 + i * ITEM_HEIGHT;
                    token = tokens[i];
                    img = void 0;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, (0, canvas_1.loadImage)(token.image_url)];
                case 4:
                    img = _b.sent();
                    return [3 /*break*/, 7];
                case 5:
                    _a = _b.sent();
                    return [4 /*yield*/, (0, canvas_1.loadImage)('https://via.placeholder.com/60x60?text=?')];
                case 6:
                    img = _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(PADDING + 40, y + 30, IMAGE_SIZE / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(img, PADDING + 10, y, IMAGE_SIZE, IMAGE_SIZE);
                    ctx.restore();
                    // Coin name
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.fillText(token.coin_name, PADDING + 90, y + 30);
                    // Market cap
                    ctx.font = '16px Arial';
                    ctx.fillStyle = SUBTEXT_COLOR;
                    ctx.fillText("Market Cap: $".concat(Number(token.market_cap).toLocaleString()), PADDING + 90, y + 55);
                    // Price
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = GREEN;
                    ctx.fillText("$".concat(Number(token.coin_price).toPrecision(4)), WIDTH - PADDING - 150, y + 40);
                    _b.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 2];
                case 9:
                    out = fs.createWriteStream('output.png');
                    stream = canvas.createPNGStream();
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            stream.on('data', function (chunk) { return out.write(chunk); });
                            stream.on('end', function () {
                                out.end();
                                console.log('Image saved as output.png');
                                resolve(null);
                            });
                            stream.on('error', reject);
                        })];
                case 10:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
drawTrendingTokensImage();
