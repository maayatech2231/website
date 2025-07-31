document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const scoreValue = document.getElementById('score-value');
    const highScoreValue = document.getElementById('high-score-value');
    const finalScore = document.getElementById('final-score');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Game settings
    const gridSize = 20;
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameSpeed = 150; // milliseconds
    let gameLoop;
    let gameRunning = false;

    // Initialize high score display
    highScoreValue.textContent = highScore;

    // Set up canvas size
    function setupCanvas() {
        // Make canvas responsive
        const containerWidth = gameScreen.clientWidth;
        const containerHeight = gameScreen.clientHeight - document.querySelector('.game-header').clientHeight;
        
        // Calculate grid dimensions (make sure they're divisible by gridSize)
        const gridWidth = Math.floor(containerWidth / gridSize) * gridSize;
        const gridHeight = Math.floor(containerHeight / gridSize) * gridSize;
        
        canvas.width = gridWidth;
        canvas.height = gridHeight;
    }

    // Initialize game
    function initGame() {
        setupCanvas();
        
        // Create initial snake (3 segments at the center)
        const centerX = Math.floor(canvas.width / (2 * gridSize)) * gridSize;
        const centerY = Math.floor(canvas.height / (2 * gridSize)) * gridSize;
        
        snake = [
            { x: centerX, y: centerY },
            { x: centerX - gridSize, y: centerY },
            { x: centerX - (2 * gridSize), y: centerY }
        ];
        
        // Reset game state
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreValue.textContent = score;
        
        // Generate first food
        generateFood();
        
        // Start game loop
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
        gameRunning = true;
    }

    // Generate food at random position
    function generateFood() {
        // Generate random coordinates (ensure they're aligned with the grid)
        const maxX = (canvas.width / gridSize) - 1;
        const maxY = (canvas.height / gridSize) - 1;
        
        let foodX, foodY;
        let foodOnSnake;
        
        // Make sure food doesn't appear on the snake
        do {
            foodOnSnake = false;
            foodX = Math.floor(Math.random() * maxX) * gridSize;
            foodY = Math.floor(Math.random() * maxY) * gridSize;
            
            // Check if food is on any snake segment
            for (let segment of snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        food = { x: foodX, y: foodY };
    }

    // Game step (called on each interval)
    function gameStep() {
        // Update direction
        direction = nextDirection;
        
        // Calculate new head position
        const head = { ...snake[0] };
        
        switch (direction) {
            case 'up':
                head.y -= gridSize;
                break;
            case 'down':
                head.y += gridSize;
                break;
            case 'left':
                head.x -= gridSize;
                break;
            case 'right':
                head.x += gridSize;
                break;
        }
        
        // Check for collisions
        if (checkCollision(head)) {
            gameOver();
            return;
        }
        
        // Add new head
        snake.unshift(head);
        
        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score++;
            scoreValue.textContent = score;
            
            // Generate new food
            generateFood();
            
            // Speed up the game slightly after every 5 points
            if (score % 5 === 0 && gameSpeed > 70) {
                clearInterval(gameLoop);
                gameSpeed -= 10;
                gameLoop = setInterval(gameStep, gameSpeed);
            }
        } else {
            // Remove tail if no food was eaten
            snake.pop();
        }
        
        // Draw everything
        draw();
    }

    // Check for collisions with walls or self
    function checkCollision(head) {
        // Wall collision
        if (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= canvas.width ||
            head.y >= canvas.height
        ) {
            return true;
        }
        
        // Self collision (skip the last segment as it will be removed)
        for (let i = 0; i < snake.length - 1; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    // Draw game elements
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw snake
        snake.forEach((segment, index) => {
            // Head is a different color
            if (index === 0) {
                ctx.fillStyle = '#2ecc71'; // Green head
            } else {
                ctx.fillStyle = '#27ae60'; // Darker green body
            }
            
            ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
            
            // Add a border to make segments more visible
            ctx.strokeStyle = 'white';
            ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
        });
        
        // Draw food
        ctx.fillStyle = '#e74c3c'; // Red food
        ctx.beginPath();
        ctx.arc(
            food.x + gridSize / 2,
            food.y + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Game over function
    function gameOver() {
        gameRunning = false;
        clearInterval(gameLoop);
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreValue.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Show game over screen
        finalScore.textContent = score;
        gameScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        // Prevent default behavior for arrow keys
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
        
        // Update direction based on key press
        // Prevent 180-degree turns (can't go directly opposite of current direction)
        switch (e.keyCode) {
            case 38: // Up arrow
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 40: // Down arrow
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 37: // Left arrow
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 39: // Right arrow
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });

    // Add touch swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        if (!gameRunning) return;
        
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Determine swipe direction based on which axis had the larger change
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
        
        e.preventDefault();
    }, { passive: false });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (gameRunning) {
            // Pause game during resize
            clearInterval(gameLoop);
            
            // Resize canvas
            setupCanvas();
            
            // Resume game
            gameLoop = setInterval(gameStep, gameSpeed);
        } else {
            setupCanvas();
        }
    });

    // Button event listeners
    startButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initGame();
    });

    restartButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initGame();
    });

    // Initial setup
    setupCanvas();
});