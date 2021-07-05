function constructBufferWithInt32(num){
    let outBuf = Buffer.alloc(4);
    outBuf.writeUInt32BE(num);
    return outBuf;
}

module.exports = {constructBufferWithInt32};