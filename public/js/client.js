$(document).ready(() => {
    const webSocket = new WebSocket('ws://localhost:8080');
    webSocket.onmessage = (message) => {
        console.log(message);
        webSocket.send('hey there');
    };

    function renderBoard() {
        $('#board').html(new Board(35, 10).print('&nbsp;', '<br>'));
    }
    renderBoard();
});
