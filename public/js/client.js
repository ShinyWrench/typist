$(document).ready(() => {
    const webSocket = new WebSocket('ws://localhost:8080');
    let previousBoard = null;
    webSocket.onmessage = (message) => {
        if (previousBoard !== message.data) {
            console.log(
                `redraw\nprevious: ${previousBoard}\ncurrent: ${message.data}`
            );
            $('#board').html(message.data);
            previousBoard = message.data;
        } else {
            console.log('no change');
        }
    };

    $(document).keydown((event) => {
        webSocket.send(event.key);
    });
});
