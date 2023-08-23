// Global variables
let playerPosition = { x: 0, y: 0 };
let score = 0;
const directions = ["north", "south", "east", "west"];

const doors = {
    north: '<span class="doors doors--north"></span>',
    east: '<span class="doors doors--east"></span>',
    south: '<span class="doors doors--south"></span>',
    west: '<span class="doors doors--west"></span>'
}

const roomEncounter = {
    white_troll: '<img src="./dist/assets/monsters/white-troll.png" alt="White troll">',
    green_troll: '<img src="./dist/assets/monsters/green-troll.png" alt="Green troll">',
    yellow_troll: '<img src="./dist/assets/monsters/yellow-troll.png" alt="Yellow troll">',
    gold: '<img src="./dist/assets/items/gold.png" alt="Gold">',
    emerald: '<img src="./dist/assets/items/emerald.png" alt="Emerald">',
    diamond: '<img src="./dist/assets/items/diamond.png" alt="Diamond">',
    exit: '<img src="./dist/assets/exit.png" alt="Exit">'
}

$(document).ready(function () {
    $.ajax({
        url: './maze-configs/maze-small.json',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            initializeMaze(data);
            // Wait for user input
            $("#userInput").keypress(function (e) {
                if (e.which === 13) { // Enter key pressed
                    let input = $(this).val().toLowerCase();
                    handleUserInput(input);
                    // clear the input field
                    $(this).val("");
                }
            });
        },
        error: function () {
            alert('Failed to load maze.');
        }
    });
});

function initializeMaze(data) {
    mazeSize = data.mazeSize;
    maze = data.rooms;
    exit = getExitCoordinates(data);

    // Further maze initializations like marking rooms as unvisited can go here
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
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    const encounterType = currentRoom.encounter;

    if (input === "start") {
        announce("You find yourself in a mysterious room. Which direction will you go? Type 'north', 'south', 'east', or 'west' to move.");
        updateMazeVisualization();
    } else if (directions.includes(input)) {
        movePlayer(input);
    } else if (input === "punch" && encounterType && encounterType.includes("troll")) {
        announce("You punched the troll! It's gone now.");
        currentRoom.encounter = null; // Remove the troll from the room
        displayEncounter(currentRoom);
    } else if (input === "pick up" && encounterType && (encounterType === "gold" || encounterType === "emerald" || encounterType === "diamond")) {
        announce(`You picked up the ${encounterType}!`);
        score += 10;  // for example, you can adjust score increments as you like
        currentRoom.encounter = null; // Remove the item from the room
        displayEncounter(currentRoom);
    } else {
        announce("Unknown command. Type 'north', 'south', 'east', or 'west' to move. If there's a troll, type 'punch' to fight it. If there's an item, type 'pick up' to collect it.");
    }
}

function movePlayer(direction) {
    let newX = playerPosition.x;
    let newY = playerPosition.y;
    switch (direction) {
        case "north":
            newY--;
            break;
        case "south":
            newY++;
            break;
        case "east":
            newX++;
            break;
        case "west":
            newX--;
            break;
    }

    if (newX >= 0 && newY >= 0 && newX < mazeSize && newY < mazeSize && maze[playerPosition.y][playerPosition.x].doors[direction]) {
        leaveRoomInDirection(direction);  // Play the leaving animation

        setTimeout(function () {
            playerPosition.x = newX;
            playerPosition.y = newY;
            enterRoomFromDirection(direction);
        }, 1000);
    } else {
        announce("You can't go that way!");
    }
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

    if (!currentRoom.visited) {
        currentRoom.visited = true;
        updateMazeVisualization();

        if (currentRoom.encounter === "exit") {
            announce("Congratulations! You found the exit!");
        } else {
            // Handle encounters here
            if (currentRoom.encounter && currentRoom.encounter.includes("troll")) {
                announce("You've encountered a troll! Type 'punch' to fight it.");
            } else if (currentRoom.encounter && (currentRoom.encounter === "gold" || currentRoom.encounter === "emerald" || currentRoom.encounter === "diamond")) {
                announce(`You see a ${currentRoom.encounter}! Type 'pick up' to collect it.`);
            } else {
                announce("You've entered a new room. Which direction will you go next?");
            }
        }
    } else {
        announce("You've been in this room before. Choose another direction to explore.");
        updateMazeVisualization();
    }

    renderMazeInConsole();
    displayEncounter(currentRoom);
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
    // Clear any existing encounters from the previous room
    $('#encounter').empty();

    const encounterType = room.encounter;
    if (encounterType && roomEncounter[encounterType]) {
        $("#encounter").append(roomEncounter[encounterType]);
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

function enterRoomFromDirection(direction) {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    let isEncounterInThatRoom = currentRoom.encounter !== null;
    let animationName = '';

    switch (direction) {
        case "north":
            animationName = isEncounterInThatRoom ? 'fromSouthEncounter' : 'arriveFromSouth';
            break;
        case "south":
            animationName = isEncounterInThatRoom ? 'fromNorthEncounter' : 'arriveFromNorth';
            break;
        case "east":
            animationName = isEncounterInThatRoom ? 'fromWestEncounter' : 'arriveFromWest';
            break;
        case "west":
            animationName = isEncounterInThatRoom ? 'fromEastEncounter' : 'arriveFromEast';
            break;
    }

    $('.hero').addClass(animationName);
    // Wait for the animation to finish
    setTimeout(function () {
        // if it's an encounter, dont remove the animation class
        if (!isEncounterInThatRoom) {
            $('.hero').removeClass(animationName);
            moveToCenter();
        }
    }, 1000);
    enterRoom();
}

function leaveRoomInDirection(direction) {
    let animationName = '';
    switch (direction) {
        case "north":
            animationName = 'leaveToNorth';
            break;
        case "south":
            animationName = 'leaveToSouth';
            break;
        case "east":
            animationName = 'leaveToEast';
            break;
        case "west":
            animationName = 'leaveToWest';
            break;
    }
    $('.hero').addClass(animationName);
    // Wait for the animation to finish
    setTimeout(function () {
        $('.hero').removeClass(animationName);
    }, 1000);

}

function moveToCenter() {
    const hero = $('.hero');
    const directionMap = {
        'fromNorthEncounter': 'toCenterFromNorth',
        'fromSouthEncounter': 'toCenterFromSouth',
        'fromEastEncounter': 'toCenterFromEast',
        'fromWestEncounter': 'toCenterFromWest',
    };

    for (let fromClass in directionMap) {
        if (hero.hasClass(fromClass)) {
            hero.addClass(directionMap[fromClass])
                .removeClass(fromClass);
            break;
        }
    }
}