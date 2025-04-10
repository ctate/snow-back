'use client'

import { useEffect, useRef, useState } from 'react'
import { GAME_CONSTANTS, COLORS, IMAGES, FONTS } from '../constants'

interface Obstacle {
  x: number
  y: number
  sprite: HTMLImageElement
}

interface Player {
  x: number
  y: number
  velocityY: number
  isMovingUp: boolean
  sprite: HTMLImageElement | null
}

interface TrailPoint {
  x: number
  y: number
}

export default function SnowBored() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const gameStateRef = useRef({
    player: {
      x: 100,
      y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
      velocityY: 0,
      isMovingUp: false,
      sprite: null as HTMLImageElement | null
    },
    obstacles: [] as Obstacle[],
    trailPoints: [] as TrailPoint[],
    frameCount: 0,
    startTime: Date.now(),
    gameSpeedMultiplier: 1,
    obstacleGenerationInterval: GAME_CONSTANTS.TREE_GENERATION_INTERVAL,
    lastSpeedIncreaseTime: 0,
    score: 0,
    isGameOver: false
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !gameStateRef.current.isGameOver) {
      gameStateRef.current.player.isMovingUp = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !gameStateRef.current.isGameOver) {
      gameStateRef.current.player.isMovingUp = false;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontLink = document.createElement('link')
    fontLink.href = FONTS.PIXEL
    fontLink.rel = 'stylesheet'
    document.head.appendChild(fontLink)

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = reject
      })
    }

    const loadObstacleSprites = async () => {
      const treeSprites = await Promise.all(IMAGES.TREES.map(loadImage))
      const snowmanSprites = await Promise.all(IMAGES.SNOWMEN.map(loadImage))
      return { treeSprites, snowmanSprites }
    }

    const initGame = async () => {
      const playerSprite = await loadImage(IMAGES.PLAYER)
      const { treeSprites, snowmanSprites } = await loadObstacleSprites()

      gameStateRef.current.player.sprite = playerSprite

      const getRandomObstacleSprite = () => {
        const useTree = Math.random() > 0.3
        const sprites = useTree ? treeSprites : snowmanSprites
        return sprites[Math.floor(Math.random() * sprites.length)]
      }

      for (let i = 0; i < 6; i++) {
        gameStateRef.current.obstacles.push({
          x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
          y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
          sprite: getRandomObstacleSprite()
        })
      }

      const drawBackground = () => {
        ctx.fillStyle = COLORS.sky
        ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)
      }

      const drawPlayer = () => {
        const { player } = gameStateRef.current
        if (player.sprite) {
          ctx.save()
          ctx.translate(player.x, player.y)
          
          if (gameStateRef.current.isGameOver) {
            ctx.rotate(-Math.PI / 2)
          }
          
          ctx.drawImage(
            player.sprite,
            -GAME_CONSTANTS.PLAYER_WIDTH / 2,
            -GAME_CONSTANTS.PLAYER_HEIGHT / 2,
            GAME_CONSTANTS.PLAYER_WIDTH,
            GAME_CONSTANTS.PLAYER_HEIGHT
          )
          ctx.restore()
        }
      }

      const drawObstacles = () => {
        gameStateRef.current.obstacles.forEach(obstacle => {
          ctx.drawImage(
            obstacle.sprite,
            obstacle.x - GAME_CONSTANTS.OBSTACLE_WIDTH / 2,
            obstacle.y - GAME_CONSTANTS.OBSTACLE_HEIGHT,
            GAME_CONSTANTS.OBSTACLE_WIDTH,
            GAME_CONSTANTS.OBSTACLE_HEIGHT
          )
        })
      }

      const drawSkiTrail = () => {
        ctx.strokeStyle = COLORS.skiTrail
        ctx.lineWidth = 2
        ctx.beginPath()
        gameStateRef.current.trailPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      }

      const drawUI = () => {
        ctx.fillStyle = '#000000'
        ctx.font = '16px "Press Start 2P"'
        
        const scoreText = `Score: ${gameStateRef.current.score}`
        const scoreWidth = ctx.measureText(scoreText).width
        ctx.fillText(scoreText, GAME_CONSTANTS.CANVAS_WIDTH - scoreWidth - 20, 30)
        
        const currentTime = gameStateRef.current.isGameOver 
          ? gameTime 
          : Math.floor((Date.now() - gameStateRef.current.startTime) / 1000)
        const timeString = new Date(currentTime * 1000).toISOString().substr(14, 5)
        ctx.fillText(timeString, 20, 30)
      }

      const checkCollision = () => {
        const { player, obstacles } = gameStateRef.current
        for (let obstacle of obstacles) {
          const dx = Math.abs(player.x - obstacle.x)
          const dy = Math.abs(player.y - obstacle.y)
          if (dx < GAME_CONSTANTS.PLAYER_WIDTH / 2 && dy < GAME_CONSTANTS.PLAYER_HEIGHT / 2) {
            return true
          }
        }
        return false
      }

      const updateGame = () => {
        if (gameStateRef.current.isGameOver) return

        const { player, obstacles, trailPoints } = gameStateRef.current
        const currentTime = Date.now()
        
        if (currentTime - gameStateRef.current.lastSpeedIncreaseTime >= 2500) {
          gameStateRef.current.gameSpeedMultiplier += 0.05
          gameStateRef.current.obstacleGenerationInterval = Math.max(
            30,
            gameStateRef.current.obstacleGenerationInterval - 5
          )
          gameStateRef.current.lastSpeedIncreaseTime = currentTime
        }

        if (player.isMovingUp) {
          player.velocityY = Math.max(player.velocityY - 0.2, -GAME_CONSTANTS.MOVEMENT_SPEED)
        } else {
          player.velocityY = Math.min(player.velocityY + GAME_CONSTANTS.GRAVITY, GAME_CONSTANTS.MOVEMENT_SPEED)
        }

        player.y += player.velocityY

        if (player.y < 50) player.y = 50
        if (player.y > GAME_CONSTANTS.CANVAS_HEIGHT - 70) player.y = GAME_CONSTANTS.CANVAS_HEIGHT - 70

        trailPoints.unshift({ x: player.x, y: player.y + 10 })
        if (trailPoints.length > 50) {
          trailPoints.pop()
        }

        gameStateRef.current.obstacles = obstacles.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - GAME_CONSTANTS.MOVEMENT_SPEED * gameStateRef.current.gameSpeedMultiplier
        })).filter(obstacle => obstacle.x > -50)

        gameStateRef.current.trailPoints = trailPoints.map(point => ({
          ...point,
          x: point.x - GAME_CONSTANTS.MOVEMENT_SPEED * gameStateRef.current.gameSpeedMultiplier
        })).filter(point => point.x > 0)

        if (gameStateRef.current.frameCount % gameStateRef.current.obstacleGenerationInterval === 0) {
          gameStateRef.current.obstacles.push({
            x: GAME_CONSTANTS.CANVAS_WIDTH + 50,
            y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
            sprite: getRandomObstacleSprite()
          })
        }

        if (checkCollision()) {
          gameStateRef.current.isGameOver = true
          setGameOver(true)
          setGameTime(Math.floor((Date.now() - gameStateRef.current.startTime) / 1000))
          return
        }

        if (gameStateRef.current.frameCount % 60 === 0) {
          gameStateRef.current.score += 10
        }

        gameStateRef.current.frameCount++
      }

      const gameLoop = () => {
        ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)
        
        drawBackground()
        drawSkiTrail()
        drawObstacles()
        drawPlayer()
        drawUI()
        
        if (!gameStateRef.current.isGameOver) {
          updateGame()
          setScore(gameStateRef.current.score)
        }
        
        requestAnimationFrame(gameLoop)
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      gameLoop()
    }

    initGame()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameOver, gameTime])

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen p-4"
      style={{
        backgroundImage: 'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ice-RFivzrFYklghXcbtYkoYiMiESh5rh5.png")',
        backgroundRepeat: 'repeat'
      }}
    >
      <h1 className={`text-4xl font-bold mb-4 ${gameOver ? 'text-red-500' : 'text-white'}`} style={{ fontFamily: '"Press Start 2P", cursive' }}>
        {gameOver ? "It's Snow Over" : "We're Snow Back"}
      </h1>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_CONSTANTS.CANVAS_WIDTH}
          height={GAME_CONSTANTS.CANVAS_HEIGHT}
          className="border-4 border-gray-700 rounded-lg"
        />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-white text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-pixel"
                style={{ fontFamily: '"Press Start 2P", cursive' }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-white mt-4">Press and hold SPACE to move up</p>
    </div>
  )
}

