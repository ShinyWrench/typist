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
        // webSocket.send('hey there');
    };

    $(document).keydown((event) => {
        console.log(event);
        switch (event.key) {
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
            case 'ArrowLeft':
                break;
            case 'ArrowRight':
                break;
            default:
                break;
        }
    });
});
