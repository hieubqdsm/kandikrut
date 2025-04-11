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

// Name management
function loadSavedName() {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        player1Name = savedName;
        playerNameInput.value = savedName;
        playerNameDisplay.textContent = savedName;
        showNameDisplay();
    } else {
        showNameEdit();
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
    const size = Math.min(
        window.innerWidth,
        window.innerHeight - scoreContainer.offsetHeight - 40
    );
    canvas.width = size;
    canvas.height = size;
    
    CANDY_SIZE = Math.floor(size / (GRID_SIZE + 0.5));
    PADDING = Math.floor((size - (GRID_SIZE * CANDY_SIZE)) / 2);
    
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

// Draw a 3D candy
function drawCandy(x, y, type, isSelected = false) {
    const color = COLORS[type];
    const centerX = x + CANDY_SIZE/2;
    const centerY = y + CANDY_SIZE/2;
    const radius = CANDY_SIZE/2 - 4;
    
    // Draw outer glow for selected candy
    if (isSelected) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }
    
    // Draw candy base
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = color.main;
    ctx.fill();
    
    // Draw border with gradient
    const gradient = ctx.createRadialGradient(
        centerX - radius/3, centerY - radius/3, 0,
        centerX, centerY, radius
    );
    gradient.addColorStop(0, color.light);
    gradient.addColorStop(1, color.dark);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    ctx.stroke();
    
    // Draw highlight (top-left)
    ctx.beginPath();
    ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fillStyle = color.light;
    ctx.fill();
    
    // Draw shadow (bottom-right)
    ctx.beginPath();
    ctx.arc(centerX + radius/3, centerY + radius/3, radius/4, 0, Math.PI * 2);
    ctx.fillStyle = color.dark;
    ctx.fill();
}

// Draw the game grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background for the grid
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = j * CANDY_SIZE + PADDING;
            const y = i * CANDY_SIZE + PADDING;
            
            if (isDragging && selectedCandy && selectedCandy.row === i && selectedCandy.col === j) {
                continue;
            }
            
            drawCandy(x, y, grid[i][j], selectedCandy && selectedCandy.row === i && selectedCandy.col === j);
        }
    }
    
    // Draw dragged candy
    if (isDragging && selectedCandy) {
        const x = dragStart.x + dragOffset.x;
        const y = dragStart.y + dragOffset.y;
        drawCandy(x, y, grid[selectedCandy.row][selectedCandy.col], true);
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

// Modify handleEnd to include multiplayer logic
const originalHandleEnd = handleEnd;
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
                // Swap candies
                const temp = grid[selectedCandy.row][selectedCandy.col];
                grid[selectedCandy.row][selectedCandy.col] = grid[row][col];
                grid[row][col] = temp;
                
                // Check for matches
                if (!removeMatches()) {
                    // If no matches, swap back
                    const temp = grid[selectedCandy.row][selectedCandy.col];
                    grid[selectedCandy.row][selectedCandy.col] = grid[row][col];
                    grid[row][col] = temp;
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
    
    // Window resize event
    window.addEventListener('resize', resizeCanvas);
    
    // Prevent default touch behavior on mobile
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
}

init(); 