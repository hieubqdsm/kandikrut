const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRID_SIZE = 8;
const CANDY_SIZE = 60;
const PADDING = 20; // Padding around the grid
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

// Draw score
function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${score}`, PADDING, canvas.height - PADDING/2);
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
    
    drawScore();
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

// Handle mouse events
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - PADDING;
    const y = event.clientY - rect.top - PADDING;
    
    const col = Math.floor(x / CANDY_SIZE);
    const row = Math.floor(y / CANDY_SIZE);
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        selectedCandy = {row, col};
        isDragging = true;
        dragStart = {x: col * CANDY_SIZE + PADDING, y: row * CANDY_SIZE + PADDING};
        dragOffset = {x: 0, y: 0};
    }
}

function handleMouseMove(event) {
    if (isDragging && selectedCandy) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        dragOffset = {
            x: x - (selectedCandy.col * CANDY_SIZE + PADDING + CANDY_SIZE/2),
            y: y - (selectedCandy.row * CANDY_SIZE + PADDING + CANDY_SIZE/2)
        };
    }
}

function handleMouseUp(event) {
    if (isDragging && selectedCandy) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - PADDING;
        const y = event.clientY - rect.top - PADDING;
        
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
    initGrid();
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    drawGrid();
}

init(); 