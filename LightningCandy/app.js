document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const scoreDisplay = document.getElementById('score');
    const width = 8;
    const squares = [];
    let score = 0;
    let isProcessing = false;

    // Neon Candy Colors
    const candyColors = ['red', 'blue', 'green', 'yellow', 'purple'];

    // Create Board
    function createBoard() {
        grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${width}, 1fr)`;

        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            // square.setAttribute('draggable', true); // Removed html5 drag for custom touch/click
            square.setAttribute('id', i);
            
            // Avoid pre-made matches on spawn
            let randomColor;
            do {
                randomColor = Math.floor(Math.random() * candyColors.length);
            } while (
                // Check left 2
                (i % width >= 2 && squares[i - 1].classList.contains(candyColors[randomColor]) && squares[i - 2].classList.contains(candyColors[randomColor])) ||
                // Check top 2
                (i >= width * 2 && squares[i - width].classList.contains(candyColors[randomColor]) && squares[i - width * 2].classList.contains(candyColors[randomColor]))
            );

            square.classList.add('candy');
            square.classList.add(candyColors[randomColor]);
            grid.appendChild(square);
            squares.push(square);
        }
    }
    createBoard();

    // Interaction Setup (Click / Touch to Swap)
    let firstSquare = null;

    squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });

    function handleSquareClick(e) {
        if (isProcessing) return; // Block input while animating falling/matching

        const square = e.target;

        if (!firstSquare) {
            // First selection
            firstSquare = square;
            square.classList.add('selected');
        } else {
            // Second selection
            const firstId = parseInt(firstSquare.id);
            const secondId = parseInt(square.id);

            firstSquare.classList.remove('selected');

            // Valid moves: Left, Right, Up, Down
            const validMoves = [firstId - 1, firstId + 1, firstId - width, firstId + width];
            
            // Edge cases to prevent wrapping (e.g., swapping right edge with left edge of next row)
            if (firstId % width === 0) { // Left Edge
                const index = validMoves.indexOf(firstId - 1);
                if (index > -1) validMoves.splice(index, 1);
            }
            if (firstId % width === width - 1) { // Right Edge
                const index = validMoves.indexOf(firstId + 1);
                if (index > -1) validMoves.splice(index, 1);
            }

            const isValidMove = validMoves.includes(secondId);

            if (isValidMove) {
                // Attempt Swap
                swapColors(firstSquare, square);
                
                // Check if swap results in a match
                const hasMatch = checkMatches();

                if (!hasMatch) {
                    // Invalid swap, revert back
                    isProcessing = true;
                    setTimeout(() => {
                        swapColors(firstSquare, square);
                        isProcessing = false;
                    }, 300); // Wait for css transition
                } else {
                    // Valid swap, matches found!
                    triggerReactions();
                }
            }
            firstSquare = null; // Reset selection
        }
    }

    function getSquareColor(square) {
        return Array.from(square.classList).find(c => candyColors.includes(c));
    }

    function swapColors(sq1, sq2) {
        const col1 = getSquareColor(sq1);
        const col2 = getSquareColor(sq2);
        
        if (col1) sq1.classList.remove(col1);
        if (col2) sq2.classList.remove(col2);
        
        if (col2) sq1.classList.add(col2);
        if (col1) sq2.classList.add(col1);
    }

    // --- Match Logic ---
    function checkMatches() {
        let isMatch = false;
        // Check Rows
        for (let i = 0; i < 64; i++) {
            if (i % width > width - 3) continue; // Skip last two columns
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = getSquareColor(squares[i]);
            const isBlank = !decidedColor;

            if (rowOfThree.every(index => getSquareColor(squares[index]) === decidedColor && !isBlank)) {
                isMatch = true;
            }
        }
        // Check Columns
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + width * 2];
            let decidedColor = getSquareColor(squares[i]);
            const isBlank = !decidedColor;

            if (columnOfThree.every(index => getSquareColor(squares[index]) === decidedColor && !isBlank)) {
                isMatch = true;
            }
        }
        return isMatch;
    }

    // Execute Match Deletion and Gravity
    function triggerReactions() {
        isProcessing = true;
        let anyMatchFound = false;

        const matchedSquares = new Set();

        // 1. Find all matches
        // Rows
        for (let i = 0; i < 64; i++) {
            if (i % width > width - 3) continue;
            let decidedColor = getSquareColor(squares[i]);
            if (!decidedColor) continue;

            let length = 1;
            while ((i + length) % width !== 0 && getSquareColor(squares[i + length]) === decidedColor) {
                length++;
            }

            if (length >= 3) {
                for (let j = 0; j < length; j++) matchedSquares.add(i + j);
            }
        }

        // Columns
        for (let i = 0; i < 64 - (width * 2); i++) {
            let decidedColor = getSquareColor(squares[i]);
            if (!decidedColor) continue;

            let length = 1;
            while (i + (length * width) < 64 && getSquareColor(squares[i + (length * width)]) === decidedColor) {
                length++;
            }

            if (length >= 3) {
                for (let j = 0; j < length; j++) matchedSquares.add(i + (j * width));
            }
        }

        // 2. Destroy matched candies with visual effects
        if (matchedSquares.size > 0) {
            anyMatchFound = true;
            score += matchedSquares.size * 10;
            scoreDisplay.innerHTML = score;

            // Screen Shake
            document.getElementById('game-container').classList.add('shake');
            setTimeout(() => document.getElementById('game-container').classList.remove('shake'), 300);

            // Create Electricity Flash Effect
            const flash = document.createElement('div');
            flash.classList.add('electric-flash');
            document.body.appendChild(flash);
            setTimeout(() => flash.style.opacity = '1', 10);
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 200);
            }, 100);

            matchedSquares.forEach(index => {
                let sq = squares[index];
                let color = getSquareColor(sq);
                if(color) sq.classList.remove(color);
                
                // Play particle effect here later
            });

            // 3. Gravity - Drop candies down
            setTimeout(() => {
                moveDown();
            }, 200);
        } else {
            isProcessing = false;
        }
    }

    function moveDown() {
        let moved = false;
        for (let i = 0; i < 56; i++) {
            let colorBelow = getSquareColor(squares[i + width]);
            let colorCurrent = getSquareColor(squares[i]);
            
            if (!colorBelow && colorCurrent) {
                squares[i + width].classList.add(colorCurrent);
                squares[i].classList.remove(colorCurrent);
                moved = true;
            }
        }

        // Refill top row
        for (let i = 0; i < width; i++) {
            if (!getSquareColor(squares[i])) {
                let randomColor = Math.floor(Math.random() * candyColors.length);
                squares[i].classList.add(candyColors[randomColor]);
                moved = true;
            }
        }

        if (moved) {
            setTimeout(moveDown, 100); // Recursive fall until settled
        } else {
            // Settle complete, check for cascaded matches!
            setTimeout(() => {
                if (checkMatches()) {
                    triggerReactions(); // Chain reaction!
                } else {
                    isProcessing = false; // Turn passed
                }
            }, 100);
        }
    }

});
