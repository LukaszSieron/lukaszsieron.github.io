function validateMaze(data) {
    let result = { isValid: true, message: '' };

    if (!hasSingleExit(data)) {
        result.isValid = false;
        result.message = 'Maze must have exactly one exit.';
        return result;
    }

    if (!validateDoorIntegrity(data)) {
        result.isValid = false;
        result.message = 'Some rooms have doors that lead to nowhere.';
        return result;
    }

    if (!isMazeSolvable(data)) {
        result.isValid = false;
        result.message = 'The maze is not solvable from every room.';
        return result;
    }

    return result;
}

function hasSingleExit(data) {
    let exitCount = 0;
    let exitLocations = [];

    for (let i = 0; i < data.rooms.length; i++) {
        const row = data.rooms[i];
        for (let j = 0; j < row.length; j++) {
            const room = row[j];
            if (room.encounter === "exit") {
                exitCount++;
                exitLocations.push(`row ${i + 1}, column ${j + 1}`);
            }
        }
    }

    if (exitCount !== 1) {
        console.log(`Invalid number of exits: ${exitCount}. Exits found at ${exitLocations.join(', ')}.`);
    }

    return exitCount === 1;
}

function validateDoorIntegrity(data) {
    const rows = data.rooms.length;
    const cols = data.rooms[0].length;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const room = data.rooms[i][j];
            const doors = room.doors;

            if (doors.north && (i === 0 || !data.rooms[i - 1][j].doors.south)) {
                console.log(`Integrity failed at row ${i + 1}, column ${j + 1}: Door to the north doesn't match.`);
                return false;
            }
            if (doors.south && (i === rows - 1 || !data.rooms[i + 1][j].doors.north)) {
                console.log(`Integrity failed at row ${i + 1}, column ${j + 1}: Door to the south doesn't match.`);
                return false;
            }
            if (doors.east && (j === cols - 1 || !data.rooms[i][j + 1].doors.west)) {
                console.log(`Integrity failed at row ${i + 1}, column ${j + 1}: Door to the east doesn't match.`);
                return false;
            }
            if (doors.west && (j === 0 || !data.rooms[i][j - 1].doors.east)) {
                console.log(`Integrity failed at row ${i + 1}, column ${j + 1}: Door to the west doesn't match.`);
                return false;
            }
        }
    }

    return true;
}

function isMazeSolvable(data) {
    const rows = data.rooms.length;
    const cols = data.rooms[0].length;
    let exitLocation = null;

    // Find the exit location
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (data.rooms[i][j].encounter === "exit") {
                exitLocation = { row: i, col: j };
                break;
            }
        }
        if (exitLocation) break;
    }

    // Depth-first search function to explore the maze
    function dfs(row, col, visited) {
        if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col]) {
            return false;
        }

        if (row === exitLocation.row && col === exitLocation.col) {
            return true;
        }

        visited[row][col] = true;

        const doors = data.rooms[row][col].doors;

        return (doors.north && dfs(row - 1, col, visited)) ||
            (doors.south && dfs(row + 1, col, visited)) ||
            (doors.east && dfs(row, col + 1, visited)) ||
            (doors.west && dfs(row, col - 1, visited));
    }

    // Check solvability from each room
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
            if (!dfs(i, j, visited)) {
                console.log(`Maze is not solvable from row ${i + 1}, column ${j + 1}.`);
                return false;
            }
        }
    }

    return true;
}