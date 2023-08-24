// Global variables
let playerPosition = { x: 0, y: 0 };
let score = 0;
let duringGame = false;
let duringEncounter = false;
let question = false;
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
    white_troll: '<img src="./dist/assets/monsters/white-troll.png" alt="White troll">',
    green_troll: '<img src="./dist/assets/monsters/green-troll.png" alt="Green troll">',
    yellow_troll: '<img src="./dist/assets/monsters/yellow-troll.png" alt="Yellow troll">',
    gold: '<img src="./dist/assets/items/gold.png" alt="Gold">',
    emerald: '<img src="./dist/assets/items/emerald.png" alt="Emerald">',
    diamond: '<img src="./dist/assets/items/diamond.png" alt="Diamond">',
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
    } else if (input === "start" && duringGame) {
        announce("Do you want to return to main menu? Type 'yes' or 'no'.");
        question = true;
    } else if (directions.includes(input)) {
        movePlayer(input);
    } else if (duringEncounter) {
        // Handle the encounter input
        handleEncounterInput(input);
    } else {
        announce("Unknown command. Type 'help' for more instructions.");
    }
}

function handleEncounterInput(input) {
    const currentRoom = maze[playerPosition.y][playerPosition.x];
    const encounterType = currentRoom.encounter;

    // Use an object to map user input to a particular action for an encounter type
    const encounterActions = {
        'white_troll': { action: 'punch', message: 'You punched the white troll! It ran away.' },
        'green_troll': { action: 'kick', message: 'You kicked the green troll! Its gone now.' },
        'yellow_troll': { action: 'throw', message: 'You threw a stone at the yellow troll! Its scared away.' },
        'gold': { action: 'collect', message: `You collected gold!` },
        'emerald': { action: 'grab', message: `You grabbed an emerald!` },
        'diamond': { action: 'pick', message: `You picked up a diamond!` },
        'exit': { action: 'exit', message: `You've found the exit! Congratulations.` }
    };

    if (encounterActions[encounterType] && input === encounterActions[encounterType].action) {
        announce(encounterActions[encounterType].message);
        currentRoom.encounter = null; // Remove the encounter
        score += 10; // Increment score
        duringEncounter = false;
        moveToCenter();
    } else {
        announce("Wrong action! Try again.");
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
    const encounter = maze[y][x].encounter;

    if (!encounter) {
        announce("The room is empty. Nothing to do here.");
        return;
    }

    let requiredAction = null;
    let announcement = null;

    switch (encounter) {
        case 'diamond':
            announcement = "You've found a shining diamond! Type 'pick' to pick it up!";
            requiredAction = "pick";
            break;
        case 'white_troll':
            announcement = "You spotted a white troll! Type 'punch' to defeat it!";
            requiredAction = "punch";
            break;
        case 'emerald':
            announcement = "You've found a gleaming emerald! Type 'grab' to pick it up!";
            requiredAction = "grab";
            break;
        case 'green_troll':
            announcement = "You encountered a green troll! Type 'kick' to kick it away!";
            requiredAction = "kick";
            break;
        case 'yellow_troll':
            announcement = "Beware! A yellow troll is blocking your way! Type 'throw' to throw a stone at it!";
            requiredAction = "throw";
            break;
        case 'gold':
            announcement = "Golden treasures await! Type 'collect' to collect them!";
            requiredAction = "collect";
            break;
        case 'exit':
            announcement = "You've found the exit! Type 'exit' to leave.";
            requiredAction = "exit";
            break;
        default:
            announcement = "Unknown encounter!";
    }

    // If userInput is null, it means this is the first time player has entered the room
    if (userInput === null) {
        announce(announcement);
        return;
    }

    // If userInput matches the required action
    if (userInput === requiredAction) {
        switch (encounter) {
            case 'diamond':
            case 'emerald':
            case 'gold':
                score += 10; // Increment score as you deem fit
                break;
            // For trolls or other enemies, you might decrease health or handle other game mechanics
        }

        maze[y][x].encounter = null;  // Remove the encounter from the room
        moveToCenter();               // Move hero to center of the room
        duringEncounter = false;     // Clear the encounter flag
        announce(`Successfully handled the ${encounter}.`); // Notify player
    } else {
        announce("Wrong action! Try again.");
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

    // now after animation finishes after 1 sec remove the toCenter class
    setTimeout(function () {
        hero.removeClass('toCenterFromNorth toCenterFromSouth toCenterFromEast toCenterFromWest');
    }, 1000);
}