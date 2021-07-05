require("dotenv").config();
const uws = require("uwebsockets.js");
const fetch = require('node-fetch');
const path = require("path");
const fs = require("fs");
const fsPromises = require('fs').promises;
const authtools = require("./authtools");
const PROTOCOL = require("./volcanic/protocol");
const {VolcanicApp} = require("./volcanic");
let vapp = new VolcanicApp();

let config = require("./config");
if(process.env.SECURE){
    console.log("Overriding secure mode");
    config.insecureHTTP = !process.env.SECURE;
}
const app = uws.App();
// Server specific utils

const mimeTypes = {
    "txt": "text/plain",
    "html": "text/html",
    "ts": "video/mp2t",
    "m3u8": "application/x-mpegURL",
    "css": "text/css",
    "js": "text/javascript",
    "mjs": "text/javascript",
    "ico": "image/vnd.microsoft.icon",
    "webp": "image/webp",
    "png": "image/png"
}
async function sendFile(path, response) {
    console.log("Sending",path);
    //let stream = fs.createReadStream(path).on("data", (data) => response.write(data.buffer)).on("end", () => response.end("AHHH")) // should work right
    response.onAborted(() => {
        // idk
    })
    // response.onAborted(() => stream.close());
    // console.log("MATCHING " + path.slice(path.lastIndexOf(".") + 1));
    if (!path.endsWith(".") && path.includes(".") && mimeTypes[path.slice(path.lastIndexOf(".") + 1)]) {
        let mimeType = mimeTypes[path.slice(path.lastIndexOf(".") + 1)];
        response.writeHeader("Content-Type", mimeType);
    } else {
        response.writeHeader("Content-Type", 'application/octet-stream');
    }

    fs.readFile(path, (err, data) => {
        if(err){
            console.log("Error " + err);
        }
        //console.log(data);
        if(!data){
            response.end("");
            return;
        }
        response.writeHeader("Content-Length", data.length.toString());
        response.end(data.buffer);
    })
}
function sendRedirect(response,url,doEnd = true){
    response.writeStatus("302 Found");
    response.writeHeader("Location",url);
    if(doEnd){
        response.end();
    }
}
function sendJson(obj, response) {
    response.writeHeader("Content-Type", "application/json");
    response.write(JSON.stringify(obj));
    response.end();
}
// Neat util for preventing directory escape
// see https://stackoverflow.com/a/45242825/10818862
function isSub(parent, dir){
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

// Main App
// Server
console.log("Setting up a server at " + process.env.PORT);
app.ws("/*", {
    idleTimeout: 600, // in case internet dies
    maxBackpressure: 100 * 1024 * 1024,
    maxPayloadLength: 16 * 1024 * 1024,
    //compression: uws.DEDICATED_COMPRESSION_3KB,
    message: async (ws, data, isBinary) => {
        //console.log("Message ",data);
        console.log("This is binary: ", isBinary);
        if(isBinary){
            ws.transport.recieve(data);
        }

    },
    open: (ws) => {
        console.log("New Connection from", ws.getRemoteAddressAsText());
        /*setTimeout(() => {
            ws.send(JSON.stringify({
                opCode: PROTOCOL.opCodes.PING,
                info: "PING!"
            }));
        }, 5 * 1000);*/
        vapp.createWebsocketTransport(ws);

        
    },
    close: (ws, code, message) => {
        // clearInterval(ws.pingInterval);
        ws.transport.setClosed(true);
    }
});
try{
    console.log(fs.readFileSync("branding.txt",{encoding: "utf8"}));
}catch(ex){
    console.log("Volcanic Networking System - Possibly corrupted version")
}

app.listen(parseInt(process.env.PORT), (listenSocket) => {
    if (listenSocket) {
        console.log("Server online at " + process.env.PORT);
    }
})