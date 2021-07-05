const PROTOCOL = require("./protocol");

const {LogicalConnection} = require("./conn");

const { v4: uuidv4 } = require('uuid');
const {constructBufferWithInt32} = require('./utils');

const pingByte = constructBufferWithInt32(PROTOCOL.PING);
const syncByte = constructBufferWithInt32(PROTOCOL.PING);

class Transport{
    constructor(pingInterval = 10 * 1000){
        this.closed = false;
        this.initDone = false;
        this.pingInterval = setInterval(() => {
            this.send_raw(pingByte);
        },pingInterval);
        this.lastPingRecievedTime = Date.now();
        this.transportID = uuidv4(); // internal id used for removal in connections
        // this.send_raw();
    }
    
    after_connect(){
        this.lc = new LogicalConnection();
        this.lc.addTransport(this);
        this.initDone = true;
    }


    send_raw(buf){
        if(!Buffer.isBuffer){
            buf = Buffer.from(buf);
        }
        if(!this.closed && this.initDone){
            this.send_internal(buf);
        }
    }

    send_internal(buf){
        // To be override by subclass
        throw new Error("Not Implemented");
    }

    setClosed(newClosed){
        this.closed = newClosed;
    }

    recieve(binaryMessage){
        binaryMessage = Buffer.from(binaryMessage); // arraybuffer to buffer
        let type = binaryMessage.readInt32BE();
        let data = binaryMessage.slice(4);
        console.log("Recieved",binaryMessage);
        console.log("I think the type is",type);
        switch (type){
            case PROTOCOL.PING:
                this.lastPingRecievedTime = Date.now();
                break;
            case PROTOCOL.ASSIGN_SESSION:
                let newSessionID = binaryMessage.slice(4); // remove type;
                if(this.lc.sessionID != newSessionID){
                    console.log("Request to switch session to",newSessionID)
                }
                break;
            default:
                console.log("Unknown Type");
        }
    }

}

class WebsocketTransport extends Transport{
    constructor(ws,...args){
        super(...args);
        this.ws = ws;
        this.ws.transport = this;
        this.after_connect()
    }

    send_internal(buf){
        this.ws.send(buf,true,true); // compress and is binary
    }

}

module.exports = {Transport,WebsocketTransport};