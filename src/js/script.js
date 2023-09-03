let mazeData = null;

// Global variables
let playerPosition = { x: 0, y: 0 };
let score = 0;
let roomsVisited = 0;
let duringGame = false;
let duringEncounter = false;
let question = false;
let flagQuestion = false;
let enemyTimer; // to hold the interval for decrementing score due to enemies

// Needed to store the previous announcement when the player is asked a question
let previousAnnouncement = null;

const directions = ["north", "south", "east", "west"];

// html elements
let levelSelectWrapper = $('.maze__level-select');
let levelSelect = $('#level');
let menuTrolls = $('.dancing-troll');
let menuHeader = $('.menu__heading');
let scoreTotal = $('#score');
let roomsTraveled = $('#rooms');

const doors = {
    north: '<span class="doors doors--north"></span>',
    east: '<span class="doors doors--east"></span>',
    south: '<span class="doors doors--south"></span>',
    west: '<span class="doors doors--west"></span>'
}

// toggle help modal on click
$('#closeModal').on('click', toggleHelpModal);

// User input handling
$("#userInput").keypress(function (e) {
    if (e.which === 13) { // Enter key pressed
        let input = $(this).val().toLowerCase();
        handleUserInput(input);
        // clear the input field
        $(this).val("");
    }
});

/**
 * Asynchronously loads the maze configuration based on the selected level.
 * Initializes the maze if the configuration is valid.
 */
async function loadMaze() {
    const level = levelSelect.val();
    try {
        const response = await fetch(`./maze-configs/${level}.json`);
        const data = await response.json();
        const validationResult = validateMaze(data);
        if (validationResult.isValid) {
            mazeData = data;
            initializeMaze(data);
            updateMazeVisualization();
            loadBackgroundImages(data.background);
        } else {
            alert(`Invalid maze configuration: ${validationResult.message}`);
        }
    } catch (error) {
        alert('Failed to load maze.');
    }
}

/**
 * Loads background images into the maze.
 * @param {string} backgroundSrc - The source URL of the background image.
 */
function loadBackgroundImages(backgroundSrc) {
    for (let i = 1; i <= 4; i++) {
        $('#maze').append(`<img class="maze__menu-background maze__menu-background--${i}" src="${backgroundSrc}" alt="Background">`);
    }
}

/**
 * Initializes the maze variables and sets the initial player position.
 * @param {Object} data - The maze configuration data.
 */
function initializeMaze(data) {
    mazeSize = data.mazeSize;
    maze = data.rooms;
    mazeEnemies = Object.keys(data.enemies);
    mazeTreasures = Object.keys(data.treasures);
    exit = getExitCoordinates(data);
    setInitialPlayerPosition();
    clearInitialRoom();
}

/**
 * Sets the initial player position randomly, ensuring it is at least 3 units away from the exit.
 */
function setInitialPlayerPosition() {
    do {
        playerPosition.x = getRandomInt(mazeSize);
        playerPosition.y = getRandomInt(mazeSize);
    } while (getDistance(playerPosition, exit) < 3);
}

/**
 * Clears any encounters in the initial room and marks it as visited.
 */
function clearInitialRoom() {
    maze[playerPosition.y][playerPosition.x].encounter = null;
    maze[playerPosition.y][playerPosition.x].visited = true;
}

/**
 * Main function to handle user input. Delegates to specific handlers based on the game state.
 * @param {string} input - The user's input command.
 */
function handleUserInput(input) {
    if (!duringGame) {
        handleMenuState(input);
    } else if (duringGame && !duringEncounter && !question && !flagQuestion) {
        handleGameState(input);
    } else if (duringEncounter) {
        handleEncounterInput(input);
    } else if (question) {
        handleQuestionState(input);
    } else if (flagQuestion) {
        handleFlagQuestionState(input);
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

/**
 * Handles user input when the game is in the menu state.
 * @param {string} input - The user's input command.
 */
function handleMenuState(input) {
    if (input === "start") {
        duringGame = true;
        resetGame();
        hideMenuItems();
        loadMaze();
        announce("You are in a maze. Try to find the exit. Type 'help' for more instructions.");
    } else if (input === "help") {
        toggleHelpModal();
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

/**
 * Handles user input during the main game state, but not during encounters or questions.
 * @param {string} input - The user's input command.
 */
function handleGameState(input) {
    if (input === "start") {
        previousAnnouncement = $('#announcer').text();
        announce("Do you want to return to the main menu? Type 'yes' or 'no'.");
        question = true;
    } else if (input === 'flag') {
        previousAnnouncement = $('#announcer').text();
        announce("Insert flag for 100 points. Pick color, type 'red', 'green', 'yellow' or 'cancel' to cancel.");
        flagQuestion = true;
    } else if (directions.includes(input)) {
        movePlayer(input);
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

/**
 * Handles user input when a yes/no question is being asked.
 * @param {string} input - The user's input command.
 */
function handleQuestionState(input) {
    if (input === "yes") {
        duringGame = false;
        duringEncounter = false;
        question = false;
        resetGame();
        announce("Game has been reset. Type 'start' to begin again.");
    } else if (input === "no") {
        question = false;
        announce(previousAnnouncement);
    } else {
        encounterAnnounce("Please answer with 'yes' or 'no'.");
    }
}

/**
 * Handles user input when the player is asked to insert a flag.
 * @param {string} input - The user's input command.
 */
function handleFlagQuestionState(input) {
    if (input === 'red' || input === 'green' || input === 'yellow') {
        insertFlag(input);
    } else if (input === 'cancel') {
        flagQuestion = false;
        announce(previousAnnouncement);
    } else {
        announce("Unknown flag color. Type 'red', 'green', 'yellow' or 'cancel' to cancel.");
    }
}

/**
 * Inserts a flag of the given color into the current room, updates the score, and displays the flag.
 * @param {string} color - The color of the flag to insert.
 */
function insertFlag(color) {
    setFlagInCurrentRoom(color);
    updateScore(-100);
    displayFlag(color);
    flagQuestion = false;
    encounterAnnounce(`${color} flag set in this room!`);
    announce(previousAnnouncement);
}

/**
 * Sets a flag of the given color in the current room.
 * @param {string} color - The color of the flag to set.
 */
function setFlagInCurrentRoom(color) {
    maze[playerPosition.y][playerPosition.x].flag = `${color}-flag`;
}

/**
 * Displays a flag of the given color in the maze.
 * @param {string} color - The color of the flag to display.
 */
function displayFlag(color) {
    $('#maze').append(`<img class="flag" src="./dist/assets/flags/${color}-flag.jpg" alt="Flag">`);
}

/**
 * Checks for the presence of a flag in the current room and displays it if found.
 */
function checkForFlag() {
    $('.flag').remove();
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    if (currentRoom.flag) {
        $('#maze').append(`<img class="flag" src="./dist/assets/flags/${currentRoom.flag}.jpg" alt="Flag">`);
    }
}

/**
 * Toggles the visibility of the help modal.
 */
function toggleHelpModal() {
    $('.help-modal').toggleClass('hidden');
}

/**
 * Starts a timer that decrements the player's score based on the number of enemies.
 * @param {number} numEnemies - The number of enemies in the room.
 */
function startEnemyTimer(numEnemies) {
    const decrementScore = () => {
        updateScore(-100 * numEnemies);
        if (score <= 0) {
            stopEnemyTimer();
            updateScore(0);
        }
    };
    enemyTimer = setInterval(decrementScore, 2000);
}

/**
 * Stops the enemy timer, halting the decrement of the player's score.
 */
function stopEnemyTimer() {
    clearInterval(enemyTimer);
}

/**
 * Handles user input during an encounter with an enemy, treasure, or exit.
 * @param {string} input - The user's input command.
 */
function handleEncounterInput(input) {
    if (!duringEncounter) return;

    const currentRoom = maze[playerPosition.y][playerPosition.x];
    let encounters = currentRoom.encounter;

    if (!encounters) return;

    encounters = Array.isArray(encounters) ? encounters : [encounters];
    const currentEncounter = encounters[0];

    let encounterData;
    if (mazeData.enemies[currentEncounter]) {
        encounterData = mazeData.enemies[currentEncounter];
    } else if (mazeData.treasures[currentEncounter]) {
        encounterData = mazeData.treasures[currentEncounter];
    } else if (currentEncounter === "exit") {
        encounterData = { action: 'exit', victory: `You've found the exit! Congratulations.` };
    }

    if (input === encounterData.action) {
        encounterAnnounce(encounterData.victory);

        // Stop the existing enemy timer
        clearInterval(enemyTimer);

        // Add 'defeated' class to the next non-defeated image
        $("#encounter").find("img:not(.defeated)").first().addClass('defeated');

        encounters.shift(); // Remove the handled encounter

        const remainingEnemies = encounters.filter(e => mazeEnemies.includes(e)).length;

        if (remainingEnemies > 0) {
            startEnemyTimer(remainingEnemies);
        }

        if (mazeData.treasures[currentEncounter]) {
            updateScore(mazeData.treasures[currentEncounter].value);
        }

        if (encounters.length === 0) {
            announce("Room cleared! Move on to the next room.");
            currentRoom.encounter = null;
            duringEncounter = false;
            stopEnemyTimer();  // Stop decrementing score due to enemies
            moveToCenter();
            openDoors();
        } else {
            // Update the timer for remaining enemies
            stopEnemyTimer();
            startEnemyTimer(remainingEnemies);
            // Otherwise, proceed to the next encounter in the list
            handleEncounter();
        }
    } else {
        encounterAnnounce("Wrong action! Try again.");
    }
}

/**
 * Returns the encounters in the given room as an array.
 * @param {object} room - The room to check for encounters.
 * @returns {array} - The encounters in the room.
 */
function getEncounters(room) {
    return Array.isArray(room.encounter) ? room.encounter : [room.encounter];
}

/**
 * Returns the current room the player is in.
 * @returns {object} - The current room.
 */
function getCurrentRoom() {
    return maze[playerPosition.y][playerPosition.x];
}

/**
 * Handles the encounter logic for the current room, announcing what the player has encountered.
 */
function handleEncounter() {
    const currentRoom = getCurrentRoom();
    const encounters = getEncounters(currentRoom);
    const currentEncounter = encounters[0];

    let announcement = '';

    if (mazeEnemies.includes(currentEncounter)) {
        announcement = mazeData.enemies[currentEncounter].announcement;
    } else if (mazeTreasures.includes(currentEncounter)) {
        announcement = mazeData.treasures[currentEncounter].announcement;
    } else if (currentEncounter === 'exit') {
        announcement = "You've found the exit! Congratulations.";
        gameOver();
    }

    if (announcement) {
        announce(announcement);
    }
}

/**
 * Updates the maze visualization by displaying available doors in the current room.
 */
function updateMazeVisualization() {
    // Clear any existing door elements from the previous room
    $('.doors').remove();

    // Fetch the current room based on player's position
    const { doors: currentDoors } = maze[playerPosition.y][playerPosition.x];

    // Check for available doors and inject them into the maze
    const $maze = $("#maze");
    for (const direction in currentDoors) {
        if (currentDoors[direction]) {
            $maze.append(doors[direction]);
        }
    }
}

/**
 * Displays the encounters (enemies, treasures, or exit) in the current room.
 * @param {object} room - The current room.
 */
function displayEncounter(room) {
    $('#encounter').empty();
    if (room.encounter) {
        const encounters = Array.isArray(room.encounter) ? room.encounter : [room.encounter];

        encounters.forEach(item => {
            let content = '';
            if (mazeEnemies.includes(item)) {
                content = mazeData.enemies[item].image;
                content = `<div class="enemy--wrapper">${content}</div>`;
            } else if (mazeTreasures.includes(item)) {
                content = mazeData.treasures[item].image;
            } else if (item === "exit") {
                content = '<img src="./dist/assets/exit.png" alt="Exit">';
            }

            $("#encounter").append(content);
        });
    }
}

/**
 * Handles the logic for entering a room, including encounters and updates.
 */
function enterRoom() {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    resetEncounterAnnouncer();

    if (!currentRoom.visited && currentRoom.encounter !== null) {
        handleFirstTimeEntry(currentRoom);
    } else {
        handleRepeatedEntry(currentRoom);
    }

    renderMazeInConsole();
    displayEncounter(currentRoom);
}

/**
 * Resets the encounter announcer to its default state.
 */
function resetEncounterAnnouncer() {
    encounterAnnounce("");
}

/**
 * Handles the logic for the first time a player enters a room.
 * @param {object} currentRoom - The room the player is entering for the first time.
 */
function handleFirstTimeEntry(currentRoom) {
    $('.flag').remove();  // Remove flag img from the room if arrived from room where you set one
    currentRoom.visited = true;  // Mark the room as visited
    updateMazeVisualization();  // Update the maze visualization
    duringEncounter = true;  // Initiate encounter state

    setTimeout(() => closeDoors(), 1000);  // After 1 sec close doors
    handleEncounter();  // Handle the encounter

    setTimeout(() => $('.enemy--wrapper').addClass('fight'), 2000);  // After 2 sec add class 'fight' to elements .enemy--wrapper

    const numEnemies = Array.isArray(currentRoom.encounter)
        ? currentRoom.encounter.filter(e => mazeEnemies.includes(e)).length
        : mazeEnemies.includes(currentRoom.encounter) ? 1 : 0;

    if (numEnemies > 0) startEnemyTimer(numEnemies);
}

/**
 * Handles the logic for when a player re-enters a room.
 * @param {object} currentRoom - The room the player is re-entering.
 */
function handleRepeatedEntry(currentRoom) {
    announce("Nothing in this room");
    updateMazeVisualization();
    checkForFlag();
}

function toggleGameOverClasses(add) {
    const classes = ['hero', 'maze__score', 'maze__rooms'];
    classes.forEach(cls => $(`.${cls}`).toggleClass('game-over', add));
}

/**
 * Shows the menu items that are hidden during the game.
 */
function showMenuItems() {
    menuTrolls.show();
    levelSelectWrapper.show();
    menuHeader.show();
}

/**
 * Removes the background images, except for the dancing troll.
 */
function removeBackgroundImages() {
    $('.maze__menu-background').not('.dancing-troll').remove();
}

/**
 * Handles the game over state, including UI updates.
 */
function gameOver() {
    duringGame = false;
    duringEncounter = false;

    showMenuItems();
    toggleGameOverClasses(true);
    removeBackgroundImages();

    encounterAnnounce("Type start to play again.");
}

/**
 * Resets the game to its initial state.
 */
function resetGame() {
    showMenuItems();
    $('.doors').remove();  // Remove all .doors elements
    toggleGameOverClasses(false);
    removeBackgroundImages();

    // Remove other classes from the hero element apart from .hero
    $('.hero').attr('class', 'hero');

    // Remove all images from the #encounter container
    $('#encounter').empty();

    //cler encounter announcer
    resetEncounterAnnouncer();

    // Unload Maze
    maze = null;
    mazeData = null;
    playerPosition = { x: 0, y: 0 };
    score = 0;
    roomsVisited = 0;
    scoreTotal.text(score);
    roomsTraveled.text(roomsVisited);
}
