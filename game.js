const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreContainer = document.getElementById('scoreContainer');
const currentPlayerSpan = document.getElementById('currentPlayer');
const playerNameInput = document.getElementById('playerName');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const nameEditContainer = document.querySelector('.name-edit');
const nameDisplayContainer = document.querySelector('.name-display');

// Game constants
const GRID_SIZE = 8;
let CANDY_SIZE;
let PADDING;

const CANDY_TYPES = 6;
const COLORS = [
    { main: '#FF0000', light: '#FF6666', dark: '#CC0000' }, // Red
    { main: '#00FF00', light: '#66FF66', dark: '#00CC00' }, // Green
    { main: '#0000FF', light: '#6666FF', dark: '#0000CC' }, // Blue
    { main: '#FFFF00', light: '#FFFF66', dark: '#CCCC00' }, // Yellow
    { main: '#FF00FF', light: '#FF66FF', dark: '#CC00CC' }, // Purple
    { main: '#00FFFF', light: '#66FFFF', dark: '#00CCCC' }  // Cyan
];

// Load candy images
const candyImages = [];
function loadCandyImages() {
    const imageNames = ['ruby', 'saphire', 'emerald', 'adventurine', 'mythril', 'diamond'];
    for (let i = 0; i < CANDY_TYPES; i++) {
        const img = new Image();
        img.src = `images/${imageNames[i]}.png`;
        candyImages.push(img);
    }
}

// Game state
let grid = [];
let selectedCandy = null;
let score = 0;
let isDragging = false;
let dragStart = null;
let dragOffset = { x: 0, y: 0 };
let animationFrame = null;
let isMultiPlayer = false;
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;
let player1Name = "Player 1";
let player2Name = "Player 2";

// Animation state
let swapAnimation = null;
let dropAnimation = null;
const ANIMATION_DURATION = 300; // milliseconds
const EASING_FUNCTION = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Quadratic easing

// Track animated candies
let animatedCandies = [];

// Animation helper functions
function animateSwap(candy1, candy2, onComplete) {
    const startTime = performance.now();
    const startPos1 = { x: candy1.col * CANDY_SIZE + PADDING, y: candy1.row * CANDY_SIZE + PADDING };
    const startPos2 = { x: candy2.col * CANDY_SIZE + PADDING, y: candy2.row * CANDY_SIZE + PADDING };
    
    // Add candies to animation tracking
    animatedCandies = [
        { ...candy1, type: grid[candy1.row][candy1.col] },
        { ...candy2, type: grid[candy2.row][candy2.col] }
    ];
    
    function updateAnimation(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easedProgress = EASING_FUNCTION(progress);
        
        if (progress < 1) {
            swapAnimation = requestAnimationFrame(updateAnimation);
            
            // Calculate current positions
            const currentPos1 = {
                x: startPos1.x + (startPos2.x - startPos1.x) * easedProgress,
                y: startPos1.y + (startPos2.y - startPos1.y) * easedProgress
            };
            
            const currentPos2 = {
                x: startPos2.x + (startPos1.x - startPos2.x) * easedProgress,
                y: startPos2.y + (startPos1.y - startPos2.y) * easedProgress
            };
            
            // Draw candies at current positions
            ctx.save();
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 20;
            ctx.drawImage(candyImages[animatedCandies[0].type], currentPos1.x, currentPos1.y, CANDY_SIZE, CANDY_SIZE);
            ctx.drawImage(candyImages[animatedCandies[1].type], currentPos2.x, currentPos2.y, CANDY_SIZE, CANDY_SIZE);
            ctx.restore();
        } else {
            swapAnimation = null;
            animatedCandies = []; // Clear animation tracking
            if (onComplete) onComplete();
        }
    }
    
    updateAnimation(startTime);
}

// Name management
function loadSavedName() {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        player1Name = savedName;
        playerNameInput.value = savedName;
        playerNameDisplay.textContent = savedName;
        showNameDisplay();
    } else {
        player1Name = "Player";
        playerNameInput.value = "Player";
        playerNameDisplay.textContent = "Player";
        showNameDisplay();
    }
}

function saveName() {
    const name = playerNameInput.value.trim();
    if (name) {
        player1Name = name;
        localStorage.setItem('playerName', name);
        playerNameDisplay.textContent = name;
        currentPlayerSpan.textContent = name;
        showNameDisplay();
    }
}

function editName() {
    playerNameInput.value = player1Name;
    showNameEdit();
}

function showNameDisplay() {
    nameEditContainer.style.display = 'none';
    nameDisplayContainer.style.display = 'flex';
}

function showNameEdit() {
    nameEditContainer.style.display = 'flex';
    nameDisplayContainer.style.display = 'none';
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMenu() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    showScreen('menuScreen');
}

function startSinglePlayer() {
    isMultiPlayer = false;
    player1Name = playerNameInput.value || "Player 1";
    currentPlayerSpan.textContent = player1Name;
    resetGame();
    showScreen('gameScreen');
    resizeCanvas();
}

function startMultiPlayer() {
    isMultiPlayer = true;
    player1Name = playerNameInput.value || "Player 1";
    player2Name = "Player 2";
    currentPlayer = 1;
    currentPlayerSpan.textContent = player1Name;
    resetGame();
    showScreen('gameScreen');
    resizeCanvas();
}

function switchPlayer() {
    if (isMultiPlayer) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        currentPlayerSpan.textContent = currentPlayer === 1 ? player1Name : player2Name;
        if (currentPlayer === 1) {
            player2Score = score;
        } else {
            player1Score = score;
        }
        score = currentPlayer === 1 ? player1Score : player2Score;
        updateScore();
    }
}

function resetGame() {
    score = 0;
    player1Score = 0;
    player2Score = 0;
    updateScore();
    initGrid();
}

// Resize canvas based on window size
function resizeCanvas() {
    // Set fixed canvas size
    canvas.width = 750;
    canvas.height = 750;
    
    // Calculate candy size and padding based on fixed canvas size
    CANDY_SIZE = Math.floor(750 / (GRID_SIZE + 0.5));
    PADDING = Math.floor((750 - (GRID_SIZE * CANDY_SIZE)) / 2);
    
    drawGrid();
}

// Initialize the game grid
function initGrid() {
    grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = Math.floor(Math.random() * CANDY_TYPES);
        }
    }
}

// Update score display
function updateScore() {
    if (isMultiPlayer) {
        scoreContainer.textContent = `${player1Name}: ${player1Score} | ${player2Name}: ${player2Score}`;
    } else {
        scoreContainer.textContent = `Score: ${score}`;
    }
}

// Modify drawCandy function to enhance gem appearance
function drawCandy(row, col, type) {
    if (type === -1) return;
    
    const x = col * CANDY_SIZE + PADDING;
    const y = row * CANDY_SIZE + PADDING;
    
    if (selectedCandy && selectedCandy.row === row && selectedCandy.col === col) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    // Draw gem with enhanced glow
    ctx.drawImage(candyImages[type], x, y, CANDY_SIZE, CANDY_SIZE);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Modify drawGrid function to handle animations
function drawGrid() {
    // Clear canvas with modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid cells with subtle glow
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = j * CANDY_SIZE + PADDING;
            const y = i * CANDY_SIZE + PADDING;
            
            // Draw cell background with subtle glow
            ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(x, y, CANDY_SIZE, CANDY_SIZE);
            ctx.shadowBlur = 0;
            
            // Skip drawing if candy is being animated
            const isAnimated = animatedCandies.some(candy => candy.row === i && candy.col === j);
            if (isAnimated) {
                continue;
            }
            
            // Skip drawing if candy is being dragged
            if (isDragging && selectedCandy && selectedCandy.row === i && selectedCandy.col === j) {
                continue;
            }
            
            drawCandy(i, j, grid[i][j]);
        }
    }
    
    // Draw dragged candy with enhanced glow and scale
    if (isDragging && selectedCandy) {
        const x = dragStart.x + dragOffset.x;
        const y = dragStart.y + dragOffset.y;
        
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Add scale effect while dragging
        const scale = 1.1;
        const scaledSize = CANDY_SIZE * scale;
        const offset = (scaledSize - CANDY_SIZE) / 2;
        
        ctx.drawImage(
            candyImages[grid[selectedCandy.row][selectedCandy.col]],
            x - offset,
            y - offset,
            scaledSize,
            scaledSize
        );
        
        ctx.restore();
    }
    
    animationFrame = requestAnimationFrame(drawGrid);
}

// Calculate score based on match length
function calculateMatchScore(matchLength) {
    switch(matchLength) {
        case 3: return 3;
        case 4: return 5;
        case 5: return 8;
        default: return matchLength > 5 ? 10 : 0;
    }
}

// Check for matches
function checkMatches() {
    let matches = new Set();
    
    // Check horizontal matches
    for (let i = 0; i < GRID_SIZE; i++) {
        let matchLength = 1;
        let startCol = 0;
        
        for (let j = 1; j <= GRID_SIZE; j++) {
            if (j < GRID_SIZE && grid[i][j] === grid[i][j-1]) {
                matchLength++;
            } else if (matchLength >= 3) {
                const points = calculateMatchScore(matchLength);
                score += points;
                for (let k = 0; k < matchLength; k++) {
                    matches.add(JSON.stringify({row: i, col: j-k-1}));
                }
                matchLength = 1;
            } else {
                matchLength = 1;
            }
        }
    }
    
    // Check vertical matches
    for (let j = 0; j < GRID_SIZE; j++) {
        let matchLength = 1;
        let startRow = 0;
        
        for (let i = 1; i <= GRID_SIZE; i++) {
            if (i < GRID_SIZE && grid[i][j] === grid[i-1][j]) {
                matchLength++;
            } else if (matchLength >= 3) {
                const points = calculateMatchScore(matchLength);
                score += points;
                for (let k = 0; k < matchLength; k++) {
                    matches.add(JSON.stringify({row: i-k-1, col: j}));
                }
                matchLength = 1;
            } else {
                matchLength = 1;
            }
        }
    }
    
    return Array.from(matches).map(m => JSON.parse(m));
}

// Remove matches and update score
function removeMatches() {
    const matches = checkMatches();
    if (matches.length > 0) {
        matches.forEach(match => {
            grid[match.row][match.col] = -1;
        });
        return true;
    }
    return false;
}

// Fill empty spaces
function fillEmptySpaces() {
    for (let j = 0; j < GRID_SIZE; j++) {
        let emptySpaces = 0;
        for (let i = GRID_SIZE - 1; i >= 0; i--) {
            if (grid[i][j] === -1) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                grid[i + emptySpaces][j] = grid[i][j];
                grid[i][j] = -1;
            }
        }
        for (let i = 0; i < emptySpaces; i++) {
            grid[i][j] = Math.floor(Math.random() * CANDY_TYPES);
        }
    }
}

// Handle touch/mouse events
function handleStart(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left - PADDING;
    const y = clientY - rect.top - PADDING;
    
    const col = Math.floor(x / CANDY_SIZE);
    const row = Math.floor(y / CANDY_SIZE);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        selectedCandy = {row, col};
        isDragging = true;
        dragStart = {x: col * CANDY_SIZE + PADDING, y: row * CANDY_SIZE + PADDING};
        dragOffset = {x: 0, y: 0};
    }
}

function handleMove(event) {
    event.preventDefault();
    if (isDragging && selectedCandy) {
        const rect = canvas.getBoundingClientRect();
        const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;
        
        dragOffset = {
            x: clientX - rect.left - (selectedCandy.col * CANDY_SIZE + PADDING + CANDY_SIZE/2),
            y: clientY - rect.top - (selectedCandy.row * CANDY_SIZE + PADDING + CANDY_SIZE/2)
        };
    }
}

// Modify handleEnd to include animation
function handleEnd(event) {
    event.preventDefault();
    if (isDragging && selectedCandy) {
        const rect = canvas.getBoundingClientRect();
        const clientX = event.type.includes('touch') ? 
            (event.changedTouches[0] ? event.changedTouches[0].clientX : event.touches[0].clientX) : 
            event.clientX;
        const clientY = event.type.includes('touch') ? 
            (event.changedTouches[0] ? event.changedTouches[0].clientY : event.touches[0].clientY) : 
            event.clientY;
        
        const x = clientX - rect.left - PADDING;
        const y = clientY - rect.top - PADDING;
        
        const col = Math.floor(x / CANDY_SIZE);
        const row = Math.floor(y / CANDY_SIZE);
        
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            const rowDiff = Math.abs(selectedCandy.row - row);
            const colDiff = Math.abs(selectedCandy.col - col);
            
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                // Animate the swap
                const candy1 = { row: selectedCandy.row, col: selectedCandy.col };
                const candy2 = { row, col };
                
                animateSwap(candy1, candy2, () => {
                    // Swap candies in grid after animation
                    const temp = grid[candy1.row][candy1.col];
                    grid[candy1.row][candy1.col] = grid[candy2.row][candy2.col];
                    grid[candy2.row][candy2.col] = temp;
                    
                    // Check for matches
                    if (!removeMatches()) {
                        // If no matches, animate swap back
                        animateSwap(candy2, candy1, () => {
                            const temp = grid[candy1.row][candy1.col];
                            grid[candy1.row][candy1.col] = grid[candy2.row][candy2.col];
                            grid[candy2.row][candy2.col] = temp;
                        });
                    } else {
                        // Fill empty spaces and check for new matches
                        fillEmptySpaces();
                        while (removeMatches()) {
                            fillEmptySpaces();
                        }
                        updateScore();
                        if (isMultiPlayer) {
                            switchPlayer();
                        }
                    }
                });
            }
        }
    }
    
    isDragging = false;
    selectedCandy = null;
    dragStart = null;
    dragOffset = {x: 0, y: 0};
}

// Initialize and start the game
function init() {
    loadCandyImages();
    loadSavedName();
    
    // Mouse events
    canvas.addEventListener('mousedown', handleStart, { passive: false });
    canvas.addEventListener('mousemove', handleMove, { passive: false });
    canvas.addEventListener('mouseup', handleEnd, { passive: false });
    canvas.addEventListener('mouseleave', handleEnd, { passive: false });
    
    // Touch events
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleEnd, { passive: false });
    
    // Add touch event for edit button
    const editButton = document.querySelector('.edit-button');
    editButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        editName();
    }, { passive: false });
    
    // Window resize event
    window.addEventListener('resize', resizeCanvas);
    
    // Prevent default touch behavior on mobile
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
}

init(); 