const {WebsocketTransport} = require("./transport");


class VolcanicApp{
    createWebsocketTransport(uwsObject){
        return new WebsocketTransport(uwsObject);
    }


}

module.exports = {VolcanicApp};