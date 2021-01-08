const webSocket = new WebSocket('ws://localhost:8080');
webSocket.onmessage = (message) => {
    console.log(message);
    webSocket.send('hey there');
};
