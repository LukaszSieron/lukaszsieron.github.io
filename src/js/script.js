// Global variables
let playerPosition = { x: 0, y: 0 };
let score = 0;
let duringGame = false;
let duringEncounter = false;
let question = false;

// Needed to store the previous announcement when the player is asked a question
let previousAnnouncement = null;

const directions = ["north", "south", "east", "west"];

let levelSelectWrapper = $('.maze__level-select');
let levelSelect = $('#level');
let menuTrolls = $('.maze__menu-troll');
let menuHeader = $('.menu__heading');

const doors = {
    north: '<span class="doors doors--north"></span>',
    east: '<span class="doors doors--east"></span>',
    south: '<span class="doors doors--south"></span>',
    west: '<span class="doors doors--west"></span>'
}

const roomEncounter = {
    white_troll: '<img class="enemy white_troll" src="./dist/assets/monsters/white-troll.png" alt="White troll">',
    green_troll: '<img class="enemy green_troll" src="./dist/assets/monsters/green-troll.png" alt="Green troll">',
    yellow_troll: '<img class="enemy yellow_troll" src="./dist/assets/monsters/yellow-troll.png" alt="Yellow troll">',
    gold: '<img class="reward gold" src="./dist/assets/items/gold.png" alt="Gold">',
    emerald: '<img class="reward emerald" src="./dist/assets/items/emerald.png" alt="Emerald">',
    diamond: '<img class="reward diamond" src="./dist/assets/items/diamond.png" alt="Diamond">',
    exit: '<img src="./dist/assets/exit.png" alt="Exit">'
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
    mazeEnemies = data.enemies;
    mazeTreasures = data.treasures;
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

    const encounterActions = {
        'white_troll': { action: 'punch', message: 'You punched the white troll! It ran away.' },
        'green_troll': { action: 'kick', message: 'You kicked the green troll! Its gone now.' },
        'yellow_troll': { action: 'throw', message: 'You threw a stone at the yellow troll! Its scared away.' },
        'gold': { action: 'collect', message: `You collected gold!` },
        'emerald': { action: 'grab', message: `You grabbed an emerald!` },
        'diamond': { action: 'pick', message: `You picked up a diamond!` },
        'exit': { action: 'exit', message: `You've found the exit! Congratulations.` }
    };

    const currentEncounter = encounters[0];

    // Check if the given input matches the required action for the current encounter
    if (encounterActions[currentEncounter] && input === encounterActions[currentEncounter].action) {
        announce(encounterActions[currentEncounter].message);

        // Add 'defeated' class to the next non-defeated image
        $("#encounter").find("img:not(.defeated)").first().addClass('defeated');

        encounters.shift(); // Remove the handled encounter

        if (mazeTreasures.includes(currentEncounter)) {
            score += 10; // Increment score for treasures
        }

        // If no more encounters are left in the room
        if (encounters.length === 0) {
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
    const x = playerPosition.x;
    const y = playerPosition.y;
    let encounters = maze[y][x].encounter;

    if (!encounters || encounters.length === 0) {
        announce("The room is empty. Nothing to do here.");
        return;
    }

    if (typeof encounters === 'string') {
        encounters = [encounters];
    }

    const enemiesInRoom = encounters.filter(item => mazeEnemies.includes(item));
    const treasuresInRoom = encounters.filter(item => mazeTreasures.includes(item));

    // Handle enemies first
    if (enemiesInRoom.length > 0) {
        const enemy = enemiesInRoom[0];
        const enemyAction = getRequiredActionForEncounter(enemy);

        if (userInput === null) {
            announce(enemyAction.announcement);
            return;
        }

        if (userInput === enemyAction.requiredAction) {
            $(`#encounter .${enemy}`).addClass('defeated'); // Mark the enemy as defeated
            enemiesInRoom.shift(); // Remove the defeated enemy
        } else {
            announce("Wrong action! Try again.");
            return;
        }
    }

    // Handle treasures if no more enemies left
    if (enemiesInRoom.length === 0) {
        if (treasuresInRoom.length > 0) {
            const treasure = treasuresInRoom[0];
            const treasureAction = getRequiredActionForEncounter(treasure);

            if (userInput === null) {
                announce(treasureAction.announcement);
                return;
            }

            if (userInput === treasureAction.requiredAction) {
                $(`#encounter .${treasure}`).addClass('defeated'); // Mark the treasure as collected
                treasuresInRoom.shift(); // Remove the collected treasure
                score += 10; // Increment score
            } else {
                announce("Wrong action! Try again.");
                return;
            }
        }
    }

    if (enemiesInRoom.length === 0 && treasuresInRoom.length === 0) {
        maze[y][x].encounter = null;  // Remove the encounter from the room
        moveToCenter();               // Move hero to center of the room
        duringEncounter = false;     // Clear the encounter flag
        announce("Room cleared!");
    }
}

function getRequiredActionForEncounter(encounter) {
    switch (encounter) {
        case 'diamond':
            return { announcement: "You've found a shining diamond! Type 'pick' to pick it up!", requiredAction: "pick" };
        case 'white_troll':
            return { announcement: "You spotted a white troll! Type 'punch' to defeat it!", requiredAction: "punch" };
        case 'emerald':
            return { announcement: "You've found a gleaming emerald! Type 'grab' to pick it up!", requiredAction: "grab" };
        case 'green_troll':
            return { announcement: "You encountered a green troll! Type 'kick' to kick it away!", requiredAction: "kick" };
        case 'yellow_troll':
            return { announcement: "Beware! A yellow troll is blocking your way! Type 'throw' to throw a stone at it!", requiredAction: "throw" };
        case 'gold':
            return { announcement: "Golden treasures await! Type 'collect' to collect them!", requiredAction: "collect" };
        case 'exit':
            return { announcement: "You've found the exit! Type 'exit' to leave.", requiredAction: "exit" };
        default:
            return { announcement: "Unknown encounter!", requiredAction: null };
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
    // Clear any existing encounters from the previous room
    $('#encounter').empty();

    // Ensure the encounter is not null and it's an array or a string
    if (room.encounter) {
        // Convert the encounter to an array if it's a string
        const encounters = Array.isArray(room.encounter) ? room.encounter : [room.encounter];

        // Split encounters into enemies and treasures
        const enemiesInRoom = encounters.filter(item => mazeEnemies.includes(item));
        const treasuresInRoom = encounters.filter(item => mazeTreasures.includes(item));

        // Display enemies first
        enemiesInRoom.forEach(enemy => {
            if (roomEncounter[enemy]) {
                $("#encounter").append(roomEncounter[enemy]);
            }
        });

        // Then display treasures
        treasuresInRoom.forEach(treasure => {
            if (roomEncounter[treasure]) {
                $("#encounter").append(roomEncounter[treasure]);
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
    playerPosition = { x: 0, y: 0 };
    score = 0;
}