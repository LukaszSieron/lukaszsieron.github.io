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
    exit = data.exit;
    console.log(maze);
    console.log(mazeSize);
    console.log(exit);

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

function startGame() {
    // Inform the player they can now start
    console.log("Type 'start' to begin your adventure!");
}

function handleUserInput(input) {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    const encounterType = currentRoom.encounter;

    if (input === "start") {
        console.log("You find yourself in a mysterious room. Which direction will you go? Type 'north', 'south', 'east', or 'west' to move.");
        updateMazeVisualization();
    } else if (directions.includes(input)) {
        movePlayer(input);
    } else if (input === "punch" && encounterType && encounterType.includes("troll")) {
        console.log("You punched the troll! It's gone now.");
        currentRoom.encounter = null; // Remove the troll from the room
        displayEncounter(currentRoom);
    } else if (input === "pick up" && encounterType && (encounterType === "gold" || encounterType === "emerald" || encounterType === "diamond")) {
        console.log(`You picked up the ${encounterType}!`);
        score += 10;  // for example, you can adjust score increments as you like
        currentRoom.encounter = null; // Remove the item from the room
        displayEncounter(currentRoom);
    } else {
        console.log("Unknown command. Type 'north', 'south', 'east', or 'west' to move. If there's a troll, type 'punch' to fight it. If there's an item, type 'pick up' to collect it.");
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

    // Check if the move is valid
    if (newX >= 0 && newY >= 0 && newX < mazeSize && newY < mazeSize && maze[playerPosition.y][playerPosition.x].doors[direction]) {
        playerPosition.x = newX;
        playerPosition.y = newY;
        enterRoom();
    } else {
        console.log("You can't go that way!");
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
    // Check if this room has been visited before
    if (!maze[playerPosition.y][playerPosition.x].visited) {
        maze[playerPosition.y][playerPosition.x].visited = true;
        // Handle encounters, items, etc. here

        // Check if the player found the exit
        if (playerPosition.x === exit.x && playerPosition.y === exit.y) {
            console.log("Congratulations! You found the exit!");
            // End the game or restart, etc.
        } else {
            console.log("You've entered a new room. Which direction will you go next?");
            updateMazeVisualization();  // Update the visual representation of the maze
        }
    } else {
        console.log("You've been in this room before. Choose another direction to explore.");
        updateMazeVisualization();  // Update the visual representation of the maze
    }
    renderMazeInConsole();

    const currentRoom = maze[playerPosition.y][playerPosition.x];
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