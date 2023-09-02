function announce(message) {
    $('#announcer').text(message);
}

function encounterAnnounce(message) {
    $('#encounterAnnouncer').text(message);
}

function closeDoors() {
    $('.doors').addClass('closed');
}

function openDoors() {
    $('.doors').removeClass('closed');
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

function hideMenuItems() {
    menuTrolls.hide();
    levelSelectWrapper.hide();
    menuHeader.hide();

}

function updateScore(amount) {
    score += amount;

    // Ensure the score doesn't go below zero
    if (score < 0) {
        score = 0;
    }

    // Update the score display
    scoreTotal.text(score);
}

function getExitCoordinates(data) {
    for (let i = 0; i < data.mazeSize; i++) {
        for (let j = 0; j < data.mazeSize; j++) {
            if (data.rooms[i][j].encounter === "exit") {
                return { x: j, y: i };
            }
        }
    }
    return null; // Should never happen if it passes the validation but just in case.
}

// Kinda cheating if user knows about it but it's a good way to test the maze.
function renderMazeInConsole() {
    let visualization = "";

    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            if (j == 0) {
                visualization += "|";
            }

            if (playerPosition.y == i && playerPosition.x == j) {
                visualization += " X ";
            } else {
                visualization += "   ";
            }

            visualization += "|";
        }
        visualization += "\n";
        visualization += Array(mazeSize * 4 + 1).join("_");
        visualization += "\n";
    }

    console.log(visualization);
}