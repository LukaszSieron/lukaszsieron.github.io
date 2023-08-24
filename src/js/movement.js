
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