import {addAnimation, addCollision, addGravity, addProjectile, CollisionHandler, GravityHandler, HandlerManager} from "./event_handler.js"
import { findAndRemoveFromList, pixelToWorld } from "./utils.js"
import TileRegistry from "./tile_registry.js"
import { addCollisionEntry} from "./collision_detector.js"
import Camera from "./camera.js"
import Game from "./game.js"
import Map from "./map.js"

/**
 * Dies ist die Basisklasse für alle Spiel-Objekte.
 * 
 * Wenn ein spezialisiertes Spiel-Objekt erzeugt wird, dann soll es 
 * immer diese Klasse erweitern. Wenn die Funktionen von der Basisklasse
 * überschrieben werden, sollten diese immer zuerst mit `super.function()` 
 * aufgerufen werden, so das die eigentliche Funktionalität der Spiel-Objekte
 * erhalten bleibt.
 */
export class GameObject {
  constructor(x, y, options = {sheet, layer: "background"}) {
    this.sheet = options.sheet
    this.tileWidth = 32
    this.tileHeight = 32
    this.x = x * this.tileWidth
    this.y = y * this.tileHeight
    this.col = 0
    this.row = 0
    this.layer = options.layer
    this.handlers = new HandlerManager([])
    TileRegistry.layers[this.layer].push(this)
  }

  /**
   * Zeichnet das Spiel-Objekt auf das Canvas. Das Spiel-Objekt
   * kennt dabei seine Position und welches Bild gezeichnet werden soll.
   * @param {CanvasRenderingContext2D} ctx Das Canvas, worauf das Spiel-Objekt gezeichnet werden soll.
   */
  draw(ctx) {
    // console.log(Game.canvas.width, Game.canvas.height, this.x, this.y)
    const transform = ctx.getTransform()
    // console.log(transform.e, transform.f)
    if (this.x > -(transform.e + this.tileWidth) && this.y > -(transform.f + this.tileHeight) && this.x < Game.canvas.width - transform.e && this.y < Game.canvas.height - transform.f) {
    // TODO: Change width and height for the origin Point
    ctx.drawImage(
      this.sheet,
      this.col, this.row, this.tileWidth, this.tileHeight,
      this.x, this.y, this.tileWidth, this.tileHeight)
    }
  }

  /**
   * Zerstört das Spiel-Objekt und entfernt es aus dem Spiel.
   */
  destroy() {
    findAndRemoveFromList(TileRegistry.layers[this.layer], this)
  }

  /**
   * Berechne die Position und andere Eigenschaften des 
   * Spiel-Objekts neu. Wie das gemacht wird, wird in den 
   * verschieden Handlers angegeben. Ein Spiel-Objekt kann
   * z.B. einen Gravitations-Handler haben, dieser fügt dann
   * Gravitation für dieses Spiel-Objekt hinzu und berechnet die 
   * y-Position des Spiel-Objekts neu.
   */
  update(){
    this.handlers && this.handlers.runAll(this)
    const colHandler = this.handlers.get(CollisionHandler)
    if (colHandler == null) return
    if (colHandler.collisionTags.length > 0){
      for (let xOffset = 0; xOffset < this.tileWidth / Game.tileWidth; xOffset++) {
        for (let yOffset = 0; yOffset < this.tileHeight / Game.tileHeight; yOffset++) {
          const coords = pixelToWorld(this.x, this.y)
          coords.x += xOffset
          coords.y += yOffset
          let index = coords.x + coords.y * (Map.width + 1)
          addCollisionEntry(index, this)
          if (coords.overflowX) {
            addCollisionEntry(index + 1, this)
          }
          if (coords.overflowY) {
            addCollisionEntry(index + Map.width + 1, this)
          }
          if (coords.overflowX && coords.overflowY) {
            addCollisionEntry(index + 1 + Map.width + 1, this)
          }
        }
      }
    }
  }
}

export class Background extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "background",
    })
    this.row = 0 * this.tileHeight
    this.col = 0 * this.tileWidth
  }
}

export class Stone extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 0 * this.tileHeight
    this.col = 1 * this.tileWidth
    addCollision(this, {collisionTags: ["world"]})    
  }
}

export class ShootingStone extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 0 * this.tileHeight
    this.col = 1 * this.tileWidth
    addProjectile(this, {
      speed: 1
    })
  }
}

export class Cave extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 1 * this.tileHeight
    this.col = 2 * this.tileWidth
    addCollision(this, {collisionTags: ["world"]})
  }
}

export class Tree extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 1 * this.tileHeight
    this.col = 1 * this.tileWidth
    addCollision(this, {collisionTags: ["world"]})
  }
}

export class Mushroom extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "item",
    })
    this.row = 0 * this.tileHeight
    this.col = 2 * this.tileWidth
    addCollision(this, {collisionTags: ["pickups"]})
  }
}

export class Flower extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "item",
    })
    this.row = 0 * this.tileHeight
    this.col = 3 * this.tileWidth
    addCollision(this, {collisionTags: ["pickups"]})
  }
}

export class Trunk extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "item",
    })
    this.row = 1
    this.col = 0
  }
}

export class Hole extends GameObject {
  constructor(x, y, forPlayer) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 1 * this.tileHeight
    this.col = 2 * this.tileWidth
    this.forPlayer = forPlayer
    addCollision(this, {collisionTags: ["cave"]})
  }
}

export class Wall extends GameObject {
  constructor(x, y) {
    const ground = document.querySelector("#ground")
    super(x, y, {
      sheet: ground,
      layer: "world",
    })
    this.row = 1 * this.tileHeight
    this.col = 3 * this.tileWidth
    addCollision(this, {collisionTags: ["world"]})
  }
}


class AnimatedGameObject extends GameObject {
  constructor(x, y, options) {
    super(x, y, options)
    this.frameCounter = 0
    this.dx = 0
    this.dy = 0
  }

  update() {
    super.update()
    this.x = this.x + this.dx
    this.y = this.y + this.dy
    this.dx = 0
    this.dy = 0
  }
}


export class Player extends AnimatedGameObject {
  constructor(x, y) {
    const img = document.querySelector("#character")
    super(x, y, {
      sheet: img,
      layer: "player",
    })
    this.tileWidth = 32
    this.tileHeight = 32
    this.row = 0 * this.tileHeight
    this.col = 1 * this.tileWidth
    this.speed = 3
    this.playerNumber = 1
    this.inGoal = false
    addAnimation(this, { framesPerAnimation: 15, numberOfFrames: 2})
    addCollision(this, { collisionTags: ["world", "pickups", "cave", "forest"] })
  }

  jump() {
    this.handlers.get(GravityHandler).jump(this)
  }

  update() {
    super.update()
  }

  move(direction) {
    if (direction === "up") {
      this.dy = this.dy + (-1) * this.speed
      this.row = 0 * this.tileHeight
    } else if (direction === "down") {
      this.dy = this.dy + (1) * this.speed
      this.row = 0 * this.tileHeight
    } else if (direction === "left") {
      this.dx = this.dx + (-1) * this.speed
      this.row = 0 * this.tileHeight
      this.col = 1 * this.tileWidth
    } else if (direction === "right") {
      this.dx = this.dx + (1) * this.speed
      this.row = 0 * this.tileHeight
      this.col = 0 * this.tileWidth
    }
  }
}

export class Player2 extends Player {
  constructor(x, y) {
    super(x, y)
    this.row = 1 * this.tileHeight
    this.col = 0 * this.tileWidth
    this.playerNumber = 2
  }
  move(direction) {
    if (direction === "up") {
      this.dy = this.dy + (-1) * this.speed
      this.row = 1 * this.tileHeight
    } else if (direction === "down") {
      this.dy = this.dy + (1) * this.speed
      this.row = 1 * this.tileHeight
    } else if (direction === "left") {
      this.dx = this.dx + (-1) * this.speed
      this.row = 1 * this.tileHeight
      this.col = 1 * this.tileWidth
    } else if (direction === "right") {
      this.dx = this.dx + (1) * this.speed
      this.row = 1 * this.tileHeight
      this.col = 0 * this.tileWidth
    } else if (direction === "right") {
      this.dx = this.dx + (1) * this.speed
      this.row = 1 * this.tileHeight
    }
  }
}