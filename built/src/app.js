"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var logger_1 = __importDefault(require("./utils/logger"));
var package_json_1 = require("../package.json");
var agora_access_token_1 = require("agora-access-token");
var socket_1 = __importDefault(require("./socket"));
var cors = require('cors');
var appID = '';
var appCertificate = '';
var port = Number(process.env.PORT) || 8080;
var corsOptions = {
    origin: 'http://localhost:3000/',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
var app = (0, express_1.default)();
var path = require('path');
var httpServer = (0, http_1.createServer)(app);
app.use(cors({
    origin: '*',
}));
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        credentials: true,
    },
});
// Fill the appID and appCertificate key given by Agora.io
// token expire time, hardcode to 3600 seconds = 1 hour
var expirationTimeInSeconds = 3600;
var role = agora_access_token_1.RtcRole.PUBLISHER;
var generateRtcToken = function (req, resp) {
    var currentTimestamp = Math.floor(Date.now() / 1000);
    var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    var channelName = req.query.channelName;
    // use 0 if uid is not specified
    var uid = req.query.uid || 0;
    if (!channelName) {
        return resp.status(400).json({ error: 'channel name is required' }).send();
    }
    var key = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
    resp.header('Access-Control-Allow-Origin', '*');
    //resp.header("Access-Control-Allow-Origin", "http://ip:port")
    return resp.json({ key: key }).send();
};
var readyTokenMain = function (req, resp) {
    var currentTimestamp = Math.floor(Date.now() / 1000);
    var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    // use 0 if uid is not specified
    var uid = req.query.uid || 0;
    var key = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, 'main', uid, role, privilegeExpiredTs);
    return resp.json({ key: key });
};
var generateRtmToken = function (req, resp) {
    var currentTimestamp = Math.floor(Date.now() / 1000);
    var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    var account = req.query.account;
    var mRole = req.query.role;
    if (!mRole) {
        return resp.status(400).json({ error: 'role is required' }).send();
    }
    if (!account) {
        return resp.status(400).json({ error: 'account is required' }).send();
    }
    var key = agora_access_token_1.RtmTokenBuilder.buildToken(appID, appCertificate, account, mRole, privilegeExpiredTs);
    // resp.header('Access-Control-Allow-Origin', '*');
    return resp.json({ key: key }).send();
};
app.use(express_1.default.static(__dirname + '/html/'));
app.get('/token', readyTokenMain);
app.get('/rtcToken', generateRtcToken);
app.get('/rtmToken', generateRtmToken);
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/html/index.html'));
});
httpServer.listen(port, function () {
    logger_1.default.info("\uD83D\uDE80 Server version ".concat(package_json_1.version, " is listening ").concat(port));
    (0, socket_1.default)({ io: io });
});
