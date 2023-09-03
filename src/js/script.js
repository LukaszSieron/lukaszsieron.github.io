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

function loadBackgroundImages(backgroundSrc) {
    for (let i = 1; i <= 4; i++) {
        $('#maze').append(`<img class="maze__menu-background maze__menu-background--${i}" src="${backgroundSrc}" alt="Background">`);
    }
}

function initializeMaze(data) {
    mazeSize = data.mazeSize;
    maze = data.rooms;
    mazeEnemies = Object.keys(data.enemies);
    mazeTreasures = Object.keys(data.treasures);
    exit = getExitCoordinates(data);
    setInitialPlayerPosition();
    clearInitialRoom();
}

function setInitialPlayerPosition() {
    do {
        playerPosition.x = getRandomInt(mazeSize);
        playerPosition.y = getRandomInt(mazeSize);
    } while (getDistance(playerPosition, exit) < 3);
}

function clearInitialRoom() {
    maze[playerPosition.y][playerPosition.x].encounter = null;
    maze[playerPosition.y][playerPosition.x].visited = true;
}

function handleUserInput(input) {
    if (!duringGame) {
        handleMenuState(input);
    } else if (duringGame && !duringEncounter && !question && !flagQuestion) {
        handleGameState(input);
    } else if (duringEncounter) {
        handleEncounterState(input);
    } else if (question) {
        handleQuestionState(input);
    } else if (flagQuestion) {
        handleFlagQuestionState(input);
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

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

function handleEncounterState(input) {
    handleEncounterInput(input);
}

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

function insertFlag(color) {
    setFlagInCurrentRoom(color);
    updateScore(-100);
    displayFlag(color);
    flagQuestion = false;
    encounterAnnounce(`${color} flag set in this room!`);
    announce(previousAnnouncement);
}

function setFlagInCurrentRoom(color) {
    maze[playerPosition.y][playerPosition.x].flag = `${color}-flag`;
}

function displayFlag(color) {
    $('#maze').append(`<img class="flag" src="./dist/assets/flags/${color}-flag.jpg" alt="Flag">`);
}

function checkForFlag() {
    $('.flag').remove();
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    if (currentRoom.flag) {
        $('#maze').append(`<img class="flag" src="./dist/assets/flags/${currentRoom.flag}.jpg" alt="Flag">`);
    }
}

function toggleHelpModal() {
    $('.help-modal').toggleClass('hidden');
}

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

function stopEnemyTimer() {
    clearInterval(enemyTimer);
}

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

function getEncounters(room) {
    return Array.isArray(room.encounter) ? room.encounter : [room.encounter];
}

function getCurrentRoom() {
    return maze[playerPosition.y][playerPosition.x];
}

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

function resetEncounterAnnouncer() {
    encounterAnnounce("");
}

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

function handleRepeatedEntry(currentRoom) {
    announce("Nothing in this room");
    updateMazeVisualization();
    checkForFlag();
}

function toggleGameOverClasses(add) {
    const classes = ['hero', 'maze__score', 'maze__rooms'];
    classes.forEach(cls => $(`.${cls}`).toggleClass('game-over', add));
}

function showMenuItems() {
    menuTrolls.show();
    levelSelectWrapper.show();
    menuHeader.show();
}

function removeBackgroundImages() {
    $('.maze__menu-background').not('.dancing-troll').remove();
}

function gameOver() {
    duringGame = false;
    duringEncounter = false;

    showMenuItems();
    toggleGameOverClasses(true);
    removeBackgroundImages();

    encounterAnnounce("Type start to play again.");
}

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
