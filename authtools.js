const crypto = require("crypto");
const {customAlphabet} = require("nanoid");
let saltGen = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz?!@()_+ABCDEFGHIJKLMNOPQRSTUVWXYZ",30);

function hashWithSalt(input, method="sha256",salt=null){
    if(!salt){
        salt = saltGen();
    }
    let hash = crypto.createHash(method);
    hash.update(salt + input);
    return salt + "." + hash.digest().toString("hex");
}

function hash(input, method = "sha256"){
    let hash = crypto.createHash(method);
    hash.update(input);
    return hash.digest().toString("hex");
}

let methods = {
    discord: function (params) {
        return hash(params.user.id);
    }
};



function generateUserID(type,params){
    if(!methods[type]){
        throw "No implementation for " + type;
    }
    return methods[type](params);
}

module.exports = {generateUserID};