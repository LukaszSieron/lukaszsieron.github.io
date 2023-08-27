let mazeData = null;

// Global variables
let playerPosition = { x: 0, y: 0 };
let score = 0;
let roomsVisited = 0;
let duringGame = false;
let duringEncounter = false;
let question = false;

// Needed to store the previous announcement when the player is asked a question
let previousAnnouncement = null;

const directions = ["north", "south", "east", "west"];

// html elements
let levelSelectWrapper = $('.maze__level-select');
let levelSelect = $('#level');
let menuTrolls = $('.maze__menu-troll');
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
        },
        error: function () {
            alert('Failed to load maze.');
        }
    });
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
        hideMenuItems();
        loadMaze();
        announce("You are in a maze. Try to find the exit. Type 'help' for more instructions.");
    } else if (input === "start" && duringGame) {
        previousAnnouncement = $('#announcer').text();
        announce("Do you want to return to the main menu? Type 'yes' or 'no'.");
        question = true;
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

function handleEncounterInput(input) {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    let encounters = currentRoom.encounter;

    if (!encounters) {
        return;
    }

    if (typeof encounters === 'string') {
        encounters = [encounters];
    }

    const currentEncounter = encounters[0];

    // Determine if the current encounter is an enemy or a treasure
    let encounterData;
    if (mazeData.enemies[currentEncounter]) {
        encounterData = mazeData.enemies[currentEncounter];
    } else if (mazeData.treasures[currentEncounter]) {
        encounterData = mazeData.treasures[currentEncounter];
    } else if (currentEncounter === "exit") {
        encounterData = { action: 'exit', victory: `You've found the exit! Congratulations.` };
    }

    // Check if the given input matches the required action for the current encounter
    if (encounterData && input === encounterData.action) {
        encounterAnnounce(encounterData.victory);

        // Add 'defeated' class to the next non-defeated image
        $("#encounter").find("img:not(.defeated)").first().addClass('defeated');

        encounters.shift(); // Remove the handled encounter

        if (mazeData.treasures[currentEncounter]) {
            score += mazeData.treasures[currentEncounter].value; // Increment score for treasures
            scoreTotal.text(score);
        }

        // If no more encounters are left in the room
        if (encounters.length === 0) {
            announce("Room cleared! Move on to the next room.");
            currentRoom.encounter = null;
            duringEncounter = false;
            moveToCenter();
            openDoors();
        } else {
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
    // reset encounterAnnouncer
    encounterAnnounce("");

    if (!currentRoom.visited && currentRoom.encounter !== null) {
        currentRoom.visited = true;
        updateMazeVisualization();

        if (currentRoom.encounter === "exit") {
            announce("Congratulations! You found the exit!");
            // End game or progress to next level
        } else {
            duringEncounter = true;
            handleEncounter();
        }
    } else {
        announce("Nothing in this room");
        updateMazeVisualization();
    }

    renderMazeInConsole();
    displayEncounter(currentRoom);
}

function handleEncounter(userInput = null) {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    let encounters = currentRoom.encounter;
    if (!encounters) return;

    encounters = Array.isArray(encounters) ? encounters : [encounters];
    const currentEncounter = encounters[0];

    if (mazeEnemies.includes(currentEncounter)) {
        const enemyData = mazeData.enemies[currentEncounter];
        if (userInput === null) {
            announce(enemyData.announcement);
        } else if (userInput === enemyData.action) {
            $("#encounter ." + currentEncounter).addClass('defeated');
            encounters.shift();
            announce(enemyData.victory);
        } else {
            announce("Wrong action! Try again.");
            return;
        }
    } else if (mazeTreasures.includes(currentEncounter)) {
        const treasureData = mazeData.treasures[currentEncounter];
        if (userInput === null) {
            announce(treasureData.announcement);
        } else if (userInput === treasureData.action) {
            $("#encounter ." + currentEncounter).addClass('defeated');
            score += treasureData.value;
            console.log(treasureData.value);
            scoreTotal.text(score);
            encounters.shift();
            announce(treasureData.victory);
        } else {
            announce("Wrong action! Try again.sssss");
            return;
        }
    } else if (currentEncounter === 'exit') {
        // Handle the exit logic
    }

    if (!encounters.length) {
        currentRoom.encounter = null;
        moveToCenter();
        duringEncounter = false;
        announce("Room cleared!");
    }
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
            if (mazeEnemies.includes(item)) {
                $("#encounter").append(mazeData.enemies[item].image);
            } else if (mazeTreasures.includes(item)) {
                $("#encounter").append(mazeData.treasures[item].image);
            } else if (item === "exit") {
                $("#encounter").append('<img src="./dist/assets/exit.png" alt="Exit">');
            }
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