$(document).ready(() => {
    const webSocket = new WebSocket('ws://localhost:8080');
    let previousMessage = null;
    webSocket.onmessage = (message) => {
        if (previousMessage !== message.data) {
            previousMessage = message.data;
            let parsed = JSON.parse(message.data);
            $('#board').html(parsed.board);
            $('#scoreboard ul').empty().append('<li>Scores</li>');
            for (let i = 0; i < parsed.scores.length; i += 2) {
                $('#scoreboard ul').append(
                    `<li>&nbsp;&nbsp;<span style='background-color: yellow;font-family: monospace;font-size: 1.2em'>${
                        parsed.scores[i]
                    }</span>&nbsp;-&nbsp;&nbsp;&nbsp;${
                        parsed.scores[i + 1]
                    } points</li>`
                );
            }
        }
    };

    $(document).keydown((event) => {
        webSocket.send(event.key);
    });
});
