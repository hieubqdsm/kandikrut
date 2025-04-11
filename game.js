const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRID_SIZE = 8;
const CANDY_SIZE = 60;
const CANDY_TYPES = 6;
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

// Game state
let grid = [];
let selectedCandy = null;
let score = 0;

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

// Draw the game grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = j * CANDY_SIZE;
            const y = i * CANDY_SIZE;
            
            // Draw candy
            ctx.fillStyle = COLORS[grid[i][j]];
            ctx.fillRect(x, y, CANDY_SIZE - 2, CANDY_SIZE - 2);
            
            // Draw border
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x, y, CANDY_SIZE - 2, CANDY_SIZE - 2);
            
            // Highlight selected candy
            if (selectedCandy && selectedCandy.row === i && selectedCandy.col === j) {
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, CANDY_SIZE - 2, CANDY_SIZE - 2);
                ctx.lineWidth = 1;
            }
        }
    }
}

// Check for matches
function checkMatches() {
    let matches = [];
    
    // Check horizontal matches
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE - 2; j++) {
            if (grid[i][j] === grid[i][j + 1] && grid[i][j] === grid[i][j + 2]) {
                matches.push({row: i, col: j});
                matches.push({row: i, col: j + 1});
                matches.push({row: i, col: j + 2});
            }
        }
    }
    
    // Check vertical matches
    for (let i = 0; i < GRID_SIZE - 2; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === grid[i + 1][j] && grid[i][j] === grid[i + 2][j]) {
                matches.push({row: i, col: j});
                matches.push({row: i + 1, col: j});
                matches.push({row: i + 2, col: j});
            }
        }
    }
    
    return matches;
}

// Remove matches and update score
function removeMatches() {
    const matches = checkMatches();
    if (matches.length > 0) {
        score += matches.length * 10;
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

// Handle candy selection and swapping
function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor(x / CANDY_SIZE);
    const row = Math.floor(y / CANDY_SIZE);
    
    if (selectedCandy === null) {
        selectedCandy = {row, col};
    } else {
        // Check if the selected candies are adjacent
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
        selectedCandy = null;
    }
    
    drawGrid();
}

// Initialize and start the game
function init() {
    initGrid();
    drawGrid();
    canvas.addEventListener('click', handleClick);
}

init(); 