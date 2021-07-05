const PROTOCOL = require("./protocol");

const {constructBufferWithInt32} = require("./utils");
const { v4: uuidv4 } = require('uuid');
const {nanoid} = require('nanoid');
let reconnKeys = {};
let assignSessionBuf = constructBufferWithInt32(PROTOCOL.ASSIGN_SESSION);

class LogicalConnection{
    // Represents an interface for sending bidirectional data
    // it in fact uses multiple connections
    constructor(){
        this.transports = [];
        this.sessionID = uuidv4(); // 36 bytes, 36*8 = 288 bits
        this.reconnKey = nanoid(64); // 512 bits, 1 byte per character 64*8 = 2^(6+3) = 2^9
        this.active = true;
        while(reconnKeys[this.reconnKey]){
            this.reconnKey = nanoid();
        }
        reconnKeys[this.reconnKey] = this;
    }

    addTransport(transport){
        transport.send_raw(Buffer.concat([assignSessionBuf,Buffer.from(this.sessionID + this.reconnKey)]));
        this.transports.push(transport);
        transport.lc = this;
    }

    removeTransport(transport){
        this.transports = this.transports.filter(transport => transport.id != transport.id);
        transport.lc = null;
    }

    destroy(){
        if(this.active){
            this.active = false;
            this.transports = [];
            delete reconnKeys[this.reconnKey];
        }
    }
}

module.exports = {LogicalConnection};