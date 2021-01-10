$(document).ready(() => {
    const webSocket = new WebSocket('ws://localhost:8080');
    let previousBoard = null;

    webSocket.onmessage = (message) => {
        if (previousBoard !== message.data) {
            $('#board').html(message.data);
            previousBoard = message.data;
        }
    };

    $(document).keydown((event) => {
        webSocket.send(event.key);
    });
});
