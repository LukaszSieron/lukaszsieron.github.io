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

// User input handling
$("#userInput").keypress(function (e) {
    if (e.which === 13) { // Enter key pressed
        let input = $(this).val().toLowerCase();
        handleUserInput(input);
        // clear the input field
        $(this).val("");
    }
});

function loadMaze() {
    let level = levelSelect.val();

    $.ajax({
        url: './maze-configs/' + level + '.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            mazeData = data;
            initializeMaze(data);
            updateMazeVisualization();

            // Load the background images
            loadBackgroundImages(data.background);
        },
        error: function () {
            alert('Failed to load maze.');
        }
    });
}

function loadBackgroundImages(backgroundSrc) {
    // Load the background images
    let loadedBackgroundImg = '<img class="maze__menu-background" src="' + backgroundSrc + '" alt="Background">';

    // create 4 copies of the background image, add class maze__menu-background-- + number to each and append to #maze
    for (let i = 1; i < 5; i++) {
        $('#maze').append(loadedBackgroundImg);
        $('.maze__menu-background').last().addClass('maze__menu-background--' + i);
    }
}

function hideMenuItems() {
    menuTrolls.hide();
    levelSelectWrapper.hide();
    menuHeader.hide();

}

function initializeMaze(data) {
    mazeSize = data.mazeSize;
    maze = data.rooms;
    mazeEnemies = Object.keys(data.enemies);  // get enemy keys
    mazeTreasures = Object.keys(data.treasures);  // get treasure keys
    exit = getExitCoordinates(data);

    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            maze[i][j].visited = false;
        }
    }

    do {
        playerPosition.x = getRandomInt(mazeSize);
        playerPosition.y = getRandomInt(mazeSize);
    } while (getDistance(playerPosition, exit) < 3);
}

function handleUserInput(input) {

    if (input === "start" && !duringGame) {
        duringGame = true;
        resetGame();
        hideMenuItems();
        loadMaze();
        announce("You are in a maze. Try to find the exit. Type 'help' for more instructions.");
    } else if (input === "help") {
        toggleHelpModal();
    } else if (input === "start" && duringGame) {
        previousAnnouncement = $('#announcer').text();
        announce("Do you want to return to the main menu? Type 'yes' or 'no'.");
        question = true;
    } else if (input === 'flag' && !duringEncounter) {
        previousAnnouncement = $('#announcer').text();
        announce("Insert flag for 100 points. Pick color, type 'red', 'green', 'yellow' or 'cancel' to cancel.");
        flagQuestion = true;
    } else if (flagQuestion) {
        if (input === 'red' || input === 'green' || input === 'yellow') {
            // set flag
            insertFlag(input);
        } else if (input === 'cancel') {
            // cancel flag setting
            flagQuestion = false;
            announce(previousAnnouncement);
        } else {
            announce("Unknown flag color. Type 'red', 'green', 'yellow' or 'cancel' to cancel.");
        }
    } else if (question) {
        if (input === "yes") {
            // Reset everything
            duringGame = false;
            duringEncounter = false;
            question = false;
            resetGame();
            announce("Game has been reset. Type 'start' to begin again.");
        } else if (input === "no") {
            // Continue game
            question = false;
            announce(previousAnnouncement);
        } else {
            encounterAnnounce("Please answer with 'yes' or 'no'.");
        }
    } else if (directions.includes(input)) {
        // Check if the player is during an encounter. If so, notify them and prevent movement.
        if (duringEncounter) {
            encounterAnnounce("You can't leave until you've dealt with the encounter!");
        } else {
            movePlayer(input);
        }
    } else if (duringEncounter) {
        // Handle the encounter input
        handleEncounterInput(input);
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

function insertFlag(color) {
    // set current room encounter to red flag
    maze[playerPosition.y][playerPosition.x].flag = color + '-flag';
    flagQuestion = false;

    // deduct 100 from score and show new score
    updateScore(-100);

    encounterAnnounce(color + " flag set in this room!");
    announce(previousAnnouncement);
    // add flag img to the room
    $('#maze').append('<img class="flag" src="./dist/assets/flags/' + color + '-flag.jpg" alt="Flag">');
}

function checkForFlag() {
    // Remove any existing flag images
    $('.flag').remove();
    const currentRoom = maze[playerPosition.y][playerPosition.x];

    if (currentRoom.flag) {
        // add flag img to the room
        $('#maze').append('<img class="flag" src="./dist/assets/flags/' + currentRoom.flag + '.jpg" alt="Flag">');
    }
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

function toggleHelpModal() {
    $('.help-modal').toggleClass('hidden');
}

function startEnemyTimer(numEnemies) {
    enemyTimer = setInterval(function () {
        updateScore(-100 * numEnemies);
        // Stop the timer if score reaches zero
        if (score <= 0) {
            clearInterval(enemyTimer);
            updateScore(0);
        }
    }, 2000);
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
        console.log('Defeated an enemy.'); // Debug
        encounterAnnounce(encounterData.victory);

        // Stop the existing enemy timer
        console.log('Stopping enemy timer with ID:', enemyTimer); // Debug
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
            startEnemyTimer(remainingEnemies); // Notice the change here
            // Otherwise, proceed to the next encounter in the list
            handleEncounter();
        }
    } else {
        encounterAnnounce("Wrong action! Try again.");
    }
}


function movePlayer(direction) {
    let newX = playerPosition.x;
    let newY = playerPosition.y;

    switch (direction) {
        case "north": newY--; break;
        case "south": newY++; break;
        case "east": newX++; break;
        case "west": newX--; break;
    }

    if (canMoveTo(newX, newY, direction)) {
        leaveRoomInDirection(direction);
        roomsVisited++;
        roomsTraveled.text(roomsVisited);
        setTimeout(function () {
            playerPosition.x = newX;
            playerPosition.y = newY;
            enterRoomFromDirection(direction);
        }, 1000);
    } else {
        announce("You can't go that way!");
    }
}

function canMoveTo(x, y, direction) {
    return x >= 0 && y >= 0 && x < mazeSize && y < mazeSize && maze[playerPosition.y][playerPosition.x].doors[direction];
}


function updateMazeVisualization() {
    // Clear any existing door elements from the previous room
    $('.doors').remove();

    // Fetch the current room based on player's position
    const currentRoom = maze[playerPosition.y][playerPosition.x];

    // Check for available doors and inject them into the maze
    for (const direction in currentRoom.doors) {
        if (currentRoom.doors[direction]) {
            $("#maze").append(doors[direction]);
        }
    }
}

function enterRoom() {
    const currentRoom = maze[playerPosition.y][playerPosition.x];

    // Reset encounterAnnouncer
    encounterAnnounce("");

    if (!currentRoom.visited && currentRoom.encounter !== null) {

        // Remove flag img from the room if arrived from room where you set one
        $('.flag').remove();

        // Mark the room as visited
        currentRoom.visited = true;

        // Update the maze visualization
        updateMazeVisualization();

        // Initiate encounter state
        duringEncounter = true;

        // After 1 sec close doors
        setTimeout(function () {
            closeDoors();
        }, 1000);

        handleEncounter();

        // after 2 sec add class 'fight' to elements .enemy--wrapper
        setTimeout(function () {
            $('.enemy--wrapper').addClass('fight');
        }, 2000);

        // Start decrementing score for each remaining undefeated enemy
        if (Array.isArray(currentRoom.encounter)) {
            const numEnemies = currentRoom.encounter.filter(e => mazeEnemies.includes(e)).length;
            if (numEnemies > 0) {
                startEnemyTimer(numEnemies);
            }
        } else if (mazeEnemies.includes(currentRoom.encounter)) {
            startEnemyTimer(1);
        }

    } else {
        announce("Nothing in this room");
        updateMazeVisualization();
        checkForFlag();
    }

    renderMazeInConsole();
    displayEncounter(currentRoom);
}

function handleEncounter() {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    let encounters = currentRoom.encounter;

    if (!encounters) return;

    encounters = Array.isArray(encounters) ? encounters : [encounters];
    const currentEncounter = encounters[0];

    if (mazeEnemies.includes(currentEncounter)) {
        const enemyData = mazeData.enemies[currentEncounter];
        announce(enemyData.announcement);
    } else if (mazeTreasures.includes(currentEncounter)) {
        const treasureData = mazeData.treasures[currentEncounter];
        announce(treasureData.announcement);
    } else if (currentEncounter === 'exit') {
        announce("You've found the exit! Congratulations.");
        gameOver();
    }
}

function gameOver() {
    duringGame = false;
    duringEncounter = false;

    menuTrolls.show();
    levelSelectWrapper.show();
    menuHeader.show();

    // add .game-over class to the hero element, .maze__score and .maze__rooms
    $('.hero').addClass('game-over');
    $('.maze__score').addClass('game-over');
    $('.maze__rooms').addClass('game-over');

    // delete the background images but not the .dancing-troll
    $('.maze__menu-background').not('.dancing-troll').remove();

    encounterAnnounce("Type start to play again.");

}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

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


function getExitCoordinates(data) {
    for (let i = 0; i < data.mazeSize; i++) {
        for (let j = 0; j < data.mazeSize; j++) {
            if (data.rooms[i][j].encounter === "exit") {
                return { x: j, y: i };
            }
        }
    }
    return null; // This will return null if no exit is found, but in a well-designed game, there should always be an exit.
}

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

function resetGame() {
    // Revert all hidden menu items
    menuTrolls.show();
    levelSelectWrapper.show();
    menuHeader.show();

    // remove .game-over class from the hero element, .maze__score and .maze__rooms
    $('.hero').removeClass('game-over');
    $('.maze__score').removeClass('game-over');
    $('.maze__rooms').removeClass('game-over');

    // delete the background images but not the .dancing-troll
    $('.maze__menu-background').not('.dancing-troll').remove();

    // Remove other classes from the hero element apart from .hero
    $('.hero').attr('class', 'hero');

    // Remove all images from the #encounter container
    $('#encounter').empty();

    // Unload Maze
    maze = null;
    mazeData = null;
    playerPosition = { x: 0, y: 0 };
    score = 0;
    roomsVisited = 0;
    scoreTotal.text(score);
    roomsTraveled.text(roomsVisited);
}

$(document).ready(function () {
    console.log($('.help-modal'));
    console.log($('#closeModal'));
    // toggle help modal on click
    $('#closeModal').on('click', toggleHelpModal);

});