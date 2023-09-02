function enterRoomFromDirection(e){let o=null!==maze[playerPosition.y][playerPosition.x].encounter,n="";switch(e){case"north":n=o?"fromSouthEncounter":"arriveFromSouth";break;case"south":n=o?"fromNorthEncounter":"arriveFromNorth";break;case"east":n=o?"fromWestEncounter":"arriveFromWest";break;case"west":n=o?"fromEastEncounter":"arriveFromEast"}$(".hero").addClass(n),setTimeout(function(){o||($(".hero").removeClass(n),moveToCenter())},1e3),enterRoom()}function leaveRoomInDirection(e){let o="";switch(e){case"north":o="leaveToNorth";break;case"south":o="leaveToSouth";break;case"east":o="leaveToEast";break;case"west":o="leaveToWest"}$(".hero").addClass(o),setTimeout(function(){$(".hero").removeClass(o)},1e3)}function moveToCenter(){const e=$(".hero");var o,n={fromNorthEncounter:"toCenterFromNorth",fromSouthEncounter:"toCenterFromSouth",fromEastEncounter:"toCenterFromEast",fromWestEncounter:"toCenterFromWest"};for(o in n)if(e.hasClass(o)){e.addClass(n[o]).removeClass(o);break}setTimeout(function(){e.removeClass("toCenterFromNorth toCenterFromSouth toCenterFromEast toCenterFromWest")},1e3)}let mazeData=null,playerPosition={x:0,y:0},score=0,roomsVisited=0,duringGame=!1,duringEncounter=!1,question=!1,flagQuestion=!1,enemyTimer,previousAnnouncement=null;const directions=["north","south","east","west"];let levelSelectWrapper=$(".maze__level-select"),levelSelect=$("#level"),menuTrolls=$(".dancing-troll"),menuHeader=$(".menu__heading"),scoreTotal=$("#score"),roomsTraveled=$("#rooms");const doors={north:'<span class="doors doors--north"></span>',east:'<span class="doors doors--east"></span>',south:'<span class="doors doors--south"></span>',west:'<span class="doors doors--west"></span>'};function loadMaze(){var e=levelSelect.val();$.ajax({url:"./maze-configs/"+e+".json",type:"GET",dataType:"json",success:function(e){var o=validateMaze(e);o.isValid?(initializeMaze(mazeData=e),updateMazeVisualization(),loadBackgroundImages(e.background)):alert("Invalid maze configuration: "+o.message)},error:function(){alert("Failed to load maze.")}})}function validateMaze(e){var o={isValid:!0,message:""};return hasSingleExit(e)?validateDoorIntegrity(e)?isMazeSolvable(e)||(o.isValid=!1,o.message="The maze is not solvable from every room."):(o.isValid=!1,o.message="Some rooms have doors that lead to nowhere."):(o.isValid=!1,o.message="Maze must have exactly one exit."),o}function hasSingleExit(e){let n=0;var t=[];for(let o=0;o<e.rooms.length;o++){var r=e.rooms[o];for(let e=0;e<r.length;e++)"exit"===r[e].encounter&&(n++,t.push(`row ${o+1}, column `+(e+1)))}return 1!==n&&console.log(`Invalid number of exits: ${n}. Exits found at ${t.join(", ")}.`),1===n}function validateDoorIntegrity(n){var t=n.rooms.length,r=n.rooms[0].length;for(let o=0;o<t;o++)for(let e=0;e<r;e++){var a=n.rooms[o][e].doors;if(a.north&&(0===o||!n.rooms[o-1][e].doors.south))return console.log(`Integrity failed at row ${o+1}, column ${e+1}: Door to the north doesn't match.`),!1;if(a.south&&(o===t-1||!n.rooms[o+1][e].doors.north))return console.log(`Integrity failed at row ${o+1}, column ${e+1}: Door to the south doesn't match.`),!1;if(a.east&&(e===r-1||!n.rooms[o][e+1].doors.west))return console.log(`Integrity failed at row ${o+1}, column ${e+1}: Door to the east doesn't match.`),!1;if(a.west&&(0===e||!n.rooms[o][e-1].doors.east))return console.log(`Integrity failed at row ${o+1}, column ${e+1}: Door to the west doesn't match.`),!1}return!0}function isMazeSolvable(a){const s=a.rooms.length,i=a.rooms[0].length;let l=null;for(let o=0;o<s;o++){for(let e=0;e<i;e++)if("exit"===a.rooms[o][e].encounter){l={row:o,col:e};break}if(l)break}for(let o=0;o<s;o++)for(let e=0;e<i;e++){var n=Array.from({length:s},()=>Array(i).fill(!1));if(!function e(o,n,t){if(o<0||o>=s||n<0||n>=i||t[o][n])return!1;if(o===l.row&&n===l.col)return!0;t[o][n]=!0;var r=a.rooms[o][n].doors;return r.north&&e(o-1,n,t)||r.south&&e(o+1,n,t)||r.east&&e(o,n+1,t)||r.west&&e(o,n-1,t)}(o,e,n))return console.log(`Maze is not solvable from row ${o+1}, column ${e+1}.`),!1}return!0}function loadBackgroundImages(e){var o='<img class="maze__menu-background" src="'+e+'" alt="Background">';for(let e=1;e<5;e++)$("#maze").append(o),$(".maze__menu-background").last().addClass("maze__menu-background--"+e)}function hideMenuItems(){menuTrolls.hide(),levelSelectWrapper.hide(),menuHeader.hide()}function initializeMaze(e){mazeSize=e.mazeSize,maze=e.rooms,mazeEnemies=Object.keys(e.enemies),mazeTreasures=Object.keys(e.treasures),exit=getExitCoordinates(e);for(let o=0;o<mazeSize;o++)for(let e=0;e<mazeSize;e++)maze[o][e].visited=!1;for(;playerPosition.x=getRandomInt(mazeSize),playerPosition.y=getRandomInt(mazeSize),getDistance(playerPosition,exit)<3;);maze[playerPosition.y][playerPosition.x].encounter=null,maze[playerPosition.y][playerPosition.x].visited=!0}function handleUserInput(e){"start"!==e||duringGame?"help"===e?toggleHelpModal():"start"===e&&duringGame?(previousAnnouncement=$("#announcer").text(),announce("Do you want to return to the main menu? Type 'yes' or 'no'."),question=!0):"flag"!==e||duringEncounter?flagQuestion?"red"===e||"green"===e||"yellow"===e?insertFlag(e):"cancel"===e?(flagQuestion=!1,announce(previousAnnouncement)):announce("Unknown flag color. Type 'red', 'green', 'yellow' or 'cancel' to cancel."):question?"yes"===e?(duringGame=!1,duringEncounter=!1,question=!1,resetGame(),announce("Game has been reset. Type 'start' to begin again.")):"no"===e?(question=!1,announce(previousAnnouncement)):encounterAnnounce("Please answer with 'yes' or 'no'."):directions.includes(e)?duringEncounter?encounterAnnounce("You can't leave until you've dealt with the encounter!"):movePlayer(e):duringEncounter?handleEncounterInput(e):announce("Unknown command. Type 'help' for more instructions."):(previousAnnouncement=$("#announcer").text(),announce("Insert flag for 100 points. Pick color, type 'red', 'green', 'yellow' or 'cancel' to cancel."),flagQuestion=!0):(duringGame=!0,resetGame(),hideMenuItems(),loadMaze(),announce("You are in a maze. Try to find the exit. Type 'help' for more instructions."))}function insertFlag(e){maze[playerPosition.y][playerPosition.x].flag=e+"-flag",flagQuestion=!1,updateScore(-100),encounterAnnounce(e+" flag set in this room!"),announce(previousAnnouncement),$("#maze").append('<img class="flag" src="./dist/assets/flags/'+e+'-flag.jpg" alt="Flag">')}function checkForFlag(){$(".flag").remove();var e=maze[playerPosition.y][playerPosition.x];e.flag&&$("#maze").append('<img class="flag" src="./dist/assets/flags/'+e.flag+'.jpg" alt="Flag">')}function updateScore(e){(score+=e)<0&&(score=0),scoreTotal.text(score)}function toggleHelpModal(){$(".help-modal").toggleClass("hidden")}function startEnemyTimer(e){enemyTimer=setInterval(function(){updateScore(-100*e),score<=0&&(clearInterval(enemyTimer),updateScore(0))},2e3)}function stopEnemyTimer(){clearInterval(enemyTimer)}function handleEncounterInput(o){if(duringEncounter){var n=maze[playerPosition.y][playerPosition.x];if(t=n.encounter){var t,r=(t=Array.isArray(t)?t:[t])[0];let e;mazeData.enemies[r]?e=mazeData.enemies[r]:mazeData.treasures[r]?e=mazeData.treasures[r]:"exit"===r&&(e={action:"exit",victory:"You've found the exit! Congratulations."}),o===e.action?(encounterAnnounce(e.victory),clearInterval(enemyTimer),$("#encounter").find("img:not(.defeated)").first().addClass("defeated"),t.shift(),0<(o=t.filter(e=>mazeEnemies.includes(e)).length)&&startEnemyTimer(o),mazeData.treasures[r]&&updateScore(mazeData.treasures[r].value),(0===t.length?(announce("Room cleared! Move on to the next room."),n.encounter=null,duringEncounter=!1,stopEnemyTimer(),moveToCenter(),openDoors):(stopEnemyTimer(),startEnemyTimer(o),handleEncounter))()):encounterAnnounce("Wrong action! Try again.")}}}function movePlayer(e){let o=playerPosition.x,n=playerPosition.y;switch(e){case"north":n--;break;case"south":n++;break;case"east":o++;break;case"west":o--}canMoveTo(o,n,e)?(leaveRoomInDirection(e),roomsVisited++,roomsTraveled.text(roomsVisited),setTimeout(function(){playerPosition.x=o,playerPosition.y=n,enterRoomFromDirection(e)},1e3)):announce("You can't go that way!")}function canMoveTo(e,o,n){return 0<=e&&0<=o&&e<mazeSize&&o<mazeSize&&maze[playerPosition.y][playerPosition.x].doors[n]}function updateMazeVisualization(){$(".doors").remove();var e=maze[playerPosition.y][playerPosition.x];for(const o in e.doors)e.doors[o]&&$("#maze").append(doors[o])}function enterRoom(){var e,o=maze[playerPosition.y][playerPosition.x];encounterAnnounce(""),o.visited||null===o.encounter?(announce("Nothing in this room"),updateMazeVisualization(),checkForFlag()):($(".flag").remove(),o.visited=!0,updateMazeVisualization(),duringEncounter=!0,setTimeout(function(){closeDoors()},1e3),handleEncounter(),setTimeout(function(){$(".enemy--wrapper").addClass("fight")},2e3),Array.isArray(o.encounter)?0<(e=o.encounter.filter(e=>mazeEnemies.includes(e)).length)&&startEnemyTimer(e):mazeEnemies.includes(o.encounter)&&startEnemyTimer(1)),renderMazeInConsole(),displayEncounter(o)}function handleEncounter(){var e=maze[playerPosition.y][playerPosition.x].encounter;e&&(e=(Array.isArray(e)?e:[e])[0],mazeEnemies.includes(e)?announce(mazeData.enemies[e].announcement):mazeTreasures.includes(e)?announce(mazeData.treasures[e].announcement):"exit"===e&&(announce("You've found the exit! Congratulations."),gameOver()))}function gameOver(){duringGame=!1,duringEncounter=!1,menuTrolls.show(),levelSelectWrapper.show(),menuHeader.show(),$(".hero").addClass("game-over"),$(".maze__score").addClass("game-over"),$(".maze__rooms").addClass("game-over"),$(".maze__menu-background").not(".dancing-troll").remove(),encounterAnnounce("Type start to play again.")}function getRandomInt(e){return Math.floor(Math.random()*e)}function getDistance(e,o){return Math.abs(e.x-o.x)+Math.abs(e.y-o.y)}function renderMazeInConsole(){let n="";for(let o=0;o<mazeSize;o++){for(let e=0;e<mazeSize;e++)0==e&&(n+="|"),playerPosition.y==o&&playerPosition.x==e?n+=" X ":n+="   ",n+="|";n=(n+="\n")+Array(4*mazeSize+1).join("_")+"\n"}console.log(n)}function displayEncounter(e){$("#encounter").empty(),e.encounter&&(Array.isArray(e.encounter)?e.encounter:[e.encounter]).forEach(e=>{let o="";mazeEnemies.includes(e)?o=`<div class="enemy--wrapper">${o=mazeData.enemies[e].image}</div>`:mazeTreasures.includes(e)?o=mazeData.treasures[e].image:"exit"===e&&(o='<img src="./dist/assets/exit.png" alt="Exit">'),$("#encounter").append(o)})}function getExitCoordinates(n){for(let o=0;o<n.mazeSize;o++)for(let e=0;e<n.mazeSize;e++)if("exit"===n.rooms[o][e].encounter)return{x:e,y:o};return null}function announce(e){$("#announcer").text(e)}function encounterAnnounce(e){$("#encounterAnnouncer").text(e)}function closeDoors(){$(".doors").addClass("closed")}function openDoors(){$(".doors").removeClass("closed")}function resetGame(){menuTrolls.show(),levelSelectWrapper.show(),menuHeader.show(),$(".hero").removeClass("game-over"),$(".maze__score").removeClass("game-over"),$(".maze__rooms").removeClass("game-over"),$(".maze__menu-background").not(".dancing-troll").remove(),$(".hero").attr("class","hero"),$("#encounter").empty(),maze=null,mazeData=null,playerPosition={x:0,y:0},score=0,roomsVisited=0,scoreTotal.text(score),roomsTraveled.text(roomsVisited)}$("#closeModal").on("click",toggleHelpModal),$("#userInput").keypress(function(e){13===e.which&&(handleUserInput($(this).val().toLowerCase()),$(this).val(""))});
//# sourceMappingURL=main.js.map
