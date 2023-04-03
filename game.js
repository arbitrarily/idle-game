let dungeon;
let tileSize = 40;
let lastClickedTile = null;

function setup() {
  createCanvas(800, 700);
  dungeon = new Dungeon(20, 15);
  tileSize = width / dungeon.width;

  // Find a corner that is not a wall and is opposite to the corner where the player spawns
  let possibleCorners = [{ x: 0, y: 0 }, { x: dungeon.width - 1, y: 0 }, { x: 0, y: dungeon.height - 1 }, { x: dungeon.width - 1, y: dungeon.height - 1 }];
  let corner = random(possibleCorners);
  while (dungeon.map[corner.y][corner.x] === 1 || ((corner.x !== 0 && corner.x !== dungeon.width - 1) || (corner.y !== 0 && corner.y !== dungeon.height - 1))) {
    corner = random(possibleCorners);
  }
  player = new Character((corner.x + 0.5) * tileSize, (corner.y + 0.5) * tileSize, 7, 12, 6, 100, 50, tileSize, tileSize);

  // Find the opposite corner to the player's spawn point
  let exitCorner = { x: dungeon.width - corner.x - 1, y: dungeon.height - corner.y - 1 };

  // Create a finish tile at the exit corner
  dungeon.map[exitCorner.y][exitCorner.x] = 2;
}

function draw() {
  background(220);
  dungeon.draw();
  player.draw();

  if (player.life <= 0) {
    textSize(48);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2);
    noLoop();
  }
}

function mouseClicked() {
  let clickedTileX = floor(mouseX / tileSize);
  let clickedTileY = floor(mouseY / tileSize);

  if (dungeon.map[clickedTileY][clickedTileX] === 2) {
    // Player reached the finish tile, restart level and increase stats
    dungeon = new Dungeon(20, 15);
    player.strength += 2;
    player.intelligence += 2;
    player.dexterity += 2;
    player.life += 15;
    player.mana += 5;

    // Set player position and finish tile position
    let possibleCorners = [{ x: 0, y: 0 }, { x: dungeon.width - 1, y: 0 }, { x: 0, y: dungeon.height - 1 }, { x: dungeon.width - 1, y: dungeon.height - 1 }];
    let corner = random(possibleCorners);
    while (dungeon.map[corner.y][corner.x] === 1) {
      corner = random(possibleCorners);
    }
    player.x = (corner.x + 0.5) * tileSize;
    player.y = (corner.y + 0.5) * tileSize;

    let oppositeCorner = { x: dungeon.width - 1 - corner.x, y: dungeon.height - 1 - corner.y };
    while (dungeon.map[oppositeCorner.y][oppositeCorner.x] === 1) {
      oppositeCorner = { x: random(1, dungeon.width - 2), y: random(1, dungeon.height - 2) };
    }
    dungeon.map[oppositeCorner.y][oppositeCorner.x] = 2;
  }

  if (lastClickedTile && lastClickedTile.x === clickedTileX && lastClickedTile.y === clickedTileY) {
    // Clicked the same tile twice, ignore
    return;
  }

  if (player.x / tileSize === clickedTileX && player.y / tileSize === clickedTileY) {
    // Clicked on the player, ignore
    return;
  }

  if (dungeon.map[clickedTileY][clickedTileX] !== 1) {
    // Clicked on a non-walkable tile, ignore
    let dx = clickedTileX - player.x / tileSize;
    let dy = clickedTileY - player.y / tileSize;
    if (abs(dx) + abs(dy) > 1) {
      // Clicked too far away, ignore
      return;
    }
    player.move(dx, dy);
  }

  lastClickedTile = { x: clickedTileX, y: clickedTileY };
}


function keyPressed() {
  switch (keyCode) {
    case LEFT_ARROW:
    case 65: // 'a' key
      player.move(-1, 0);
      break;
    case RIGHT_ARROW:
    case 68: // 'd' key
      player.move(1, 0);
      break;
    case UP_ARROW:
    case 87: // 'w' key
      player.move(0, -1);
      break;
    case DOWN_ARROW:
    case 83: // 's' key
      player.move(0, 1);
      break;
    default:
      // Do nothing
      break;
  }
}

class Character {
  constructor(x, y, strength, intelligence, dexterity, life, mana, width, height) {
    this.x = x;
    this.y = y;
    this.strength = strength;
    this.intelligence = intelligence;
    this.dexterity = dexterity;
    this.life = life;
    this.mana = mana;
    this.width = width;
    this.height = height;
    this.experience = 0;
    this.level = 1;
    this.experienceRequired = 500;
  }

  draw() {
    // Determine the position of the tile the character is currently occupying
    let tileX = floor(this.x / tileSize);
    let tileY = floor(this.y / tileSize);

    // Draw the character at the center of the tile it is occupying
    fill(0, 255, 0);
    rect(tileX * tileSize, tileY * tileSize, this.width, this.height);

    // Draw the stats and other text
    textSize(16);
    textAlign(CENTER, CENTER);
    fill(0);
    text("Strength: " + this.strength + "  |  Intelligence: " + this.intelligence + "  |  Dexterity: " + this.dexterity, width / 2, height - 32);
    text("Life: " + this.life, 32, height - 16);
    text("Mana: " + this.mana, width - 64, height - 16);

    // Draw the experience bar
    let experienceRatio = this.experience / this.experienceRequired;
    let barWidth = 200;
    let barHeight = 20;
    let barX = width / 2 - barWidth / 2;
    let barY = height - 72;
    noStroke();
    fill(200);
    rect(barX, barY, barWidth, barHeight);
    fill(0, 255, 0);
    rect(barX, barY, barWidth * experienceRatio, barHeight);
    textSize(16);
    fill(0);
    text("Level " + this.level + " (" + this.experience + "/" + this.experienceRequired + ")", width / 2, height - 60);

    // Check for collisions with walls
    if (dungeon.map[tileY][tileX] === 1) {
      this.x = max(tileX * tileSize + this.width / 2, min(this.x, (tileX + 1) * tileSize - this.width / 2));
      this.y = max(tileY * tileSize + this.height / 2, min(this.y, (tileY + 1) * tileSize - this.height / 2));
    }

    // Gain experience for moving into a new tile
    if (lastClickedTile && (lastClickedTile.x !== tileX || lastClickedTile.y !== tileY)) {
      this.experience += 5;
    }

    // Check if the character has enough experience to level up
    if (this.experience >= this.experienceRequired) {
      this.levelUp();
    }
  }

  levelUp() {
    // Increase level and set new experience requirement
    this.level++;
    this.experienceRequired = ceil(this.experienceRequired * 1.25);

    // Gain experience and reset current experience
    // let experienceGained = ceil(this.experience * 0.5) + 1000;
    this.experience = 0;
    // this.experience += experienceGained;

    // Increase stats
    this.strength += 2;
    this.intelligence += 2
    this.dexterity += 2;
    this.life += 15;
    this.mana += 5;
  }

  move(dx, dy) {
    let newX = this.x + dx * tileSize;
    let newY = this.y + dy * tileSize;
    let newTileX = floor(newX / tileSize);
    let newTileY = floor(newY / tileSize);
    if (newTileX >= 0 && newTileX < dungeon.width && newTileY >= 0 && newTileY < dungeon.height && dungeon.map[newTileY][newTileX] === 0) {
      this.x = newX;
      this.y = newY;

      // Gain experience for moving into a new tile
      this.experience += 5;
    }
  }

  isColliding(other) {
    let distance = dist(this.x, this.y, other.x, other.y);
    return distance < this.width / 2 + other.width / 2;
  }

  takeDamage(damage) {
    this.life -= damage;
  }
}



class Dungeon {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.map = [];
    for (let y = 0; y < height; y++) {
      this.map[y] = [];
      for (let x = 0; x < width; x++) {
        this.map[y][x] = 1;
      }
    }
    this.generate();
    this.finishTileColor = color(200, 0, 0); // Set the color of the finish tile
  }

  draw() {
    // Draw the walls
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.map[y][x] === 1) {
          fill(50, 50, 50);
          rect(x * tileSize, y * tileSize, tileSize, tileSize);
        } else if (this.map[y][x] === 2) {
          fill(this.finishTileColor); // Use the finish tile color
          rect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Draw the grid
    stroke(0);
    strokeWeight(1);
    for (let y = 0; y <= this.height; y++) {
      line(0, y * tileSize, this.width * tileSize, y * tileSize);
    }
    for (let x = 0; x <= this.width; x++) {
      line(x * tileSize, 0, x * tileSize, this.height * tileSize);
    }
  }

  generate() {
    let stack = [];
    let visited = [];
    let startX = floor(random(this.width));
    let startY = floor(random(this.height));
    stack.push({ x: startX, y: startY });
    visited.push({ x: startX, y: startY });
    while (stack.length > 0) {
      let current = stack.pop();
      let directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      shuffle(directions, true);
      for (let i = 0; i < directions.length; i++) {
        let nextX = current.x + directions[i].x;
        let nextY = current.y + directions[i].y;
        if (nextX >= 0 && nextX < this.width && nextY >= 0 && nextY < this.height && !this.isVisited(nextX, nextY, visited)) {
          this.map[current.y][current.x] = 0;
          visited.push({ x: nextX, y: nextY });
          stack.push({ x: nextX, y: nextY });
        }
      }
    }
  }

  isVisited(x, y, visited) {
    for (let i = 0; i < visited.length; i++) {
      if (visited[i].x === x && visited[i].y === y) {
        return true;
      }
    }
    return false;
  }
}
