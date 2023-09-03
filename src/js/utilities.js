/**
 * Updates the main announcer with a given message.
 * @param {string} message - The message to display.
 */
function announce(message) {
    $('#announcer').text(message);
}

/**
 * Updates the encounter announcer with a given message.
 * Encounter announcer is the one on the bottom of the screen.
 * @param {string} message - The message to display.
 */
function encounterAnnounce(message) {
    $('#encounterAnnouncer').text(message);
}

/**
 * Closes all doors in the current room by adding the 'closed' class.
 */
function closeDoors() {
    $('.doors').addClass('closed');
}

/**
 * Opens all doors in the current room by removing the 'closed' class.
 */
function openDoors() {
    $('.doors').removeClass('closed');
}

/**
 * Generates a random integer between 0 and the given maximum (exclusive).
 * @param {number} max - The maximum value.
 * @returns {number} - A random integer.
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Calculates the Manhattan distance between two positions.
 * @param {Object} pos1 - The first position.
 * @param {Object} pos2 - The second position.
 * @returns {number} - The so called Manhattan distance.
 */
function getDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Hides menu items by setting their visibility to hidden.
 */
function hideMenuItems() {
    menuTrolls.hide();
    levelSelectWrapper.hide();
    menuHeader.hide();

}

/**
 * Updates the player's score by a given amount.
 * @param {number} amount - The amount to update the score by.
 */
function updateScore(amount) {
    score += amount;

    // Ensure the score doesn't go below zero
    if (score < 0) {
        score = 0;
    }

    // Update the score display
    scoreTotal.text(score);
}

/**
 * Finds and returns the coordinates of the exit in the maze.
 * @param {Object} data - The maze data.
 * @returns {Object|null} - The coordinates of the exit or null if not found.
 */
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

/**
 * Renders a simple text-based visualization of the maze in the console.
 * Mainly for debugging purposes.
 * Kinda cheating if user knows about it but it's not like it's a part of the game.
 */
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