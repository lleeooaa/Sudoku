let selectedCell = null;
let sudokuData = null;
let pencilMarkMode = false;
let startTime = null;
let timerInterval = null;

document.addEventListener('keydown', handleKeyDown);

function togglePencilMarkMode() {
    pencilMarkMode = !pencilMarkMode;
    const pencilMarkButton = document.getElementById('pencil-mark-button');
    pencilMarkButton.textContent = pencilMarkMode ? 'Pencil Mark : On' : 'Pencil Mark : Off';
}

function generateSudoku(difficulty) {
    let n = 9;
    let k;
    switch (difficulty) {
        case 'easy':
            k = 20;
            break;
        case 'medium':
            k = 45;
            break;
        case 'hard':
            k = 50;
            break;
        case 'expert':
            k = 55;
            break;
    }
    fetch(`/sudoku?N=${n}&K=${k}`)
        .then(response => response.json())
        .then(data => {
            sudokuData = data;
            const sudokuGrid = document.getElementById('sudoku-grid');
            sudokuGrid.innerHTML = '';
            for (let i = 0; i < n; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < n; j++) {
                    const cell = document.createElement('td');
                    const value = data[i][j];
                    cell.textContent = value === 0 ? '' : value;
                    if (value === 0) {
                        cell.classList.add('empty');
                    } else {
                        cell.classList.add('predefined');
                    }
                    cell.addEventListener('click', selectCell);
                    row.appendChild(cell);
                }
                sudokuGrid.appendChild(row);
            }
            displayMessage('');
            startTimer();
        })
        .catch(error => console.error('Error:', error));
}

function startTimer() {
    startTime = new Date();
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = new Date() - startTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
    document.getElementById('timer').textContent = `${hours}:${minutes}:${seconds}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function selectCell(event) {
    const target = event.target.closest('td'); // Use closest to handle clicks on pencil marks

    if (selectedCell) {
        clearHighlights();
        selectedCell.classList.remove('selected');
    }
    selectedCell = target;
    selectedCell.classList.add('selected');

    // Only highlight cells with numbers
    if (selectedCell.textContent !== '' && !selectedCell.classList.contains('pencil-mode')) {
        highlightCells(selectedCell);
        highlightSameValues(selectedCell);
    }
}

function fillCell(value) {
    if (selectedCell && selectedCell.classList.contains('empty')) {
        const row = selectedCell.parentElement.rowIndex;
        const col = selectedCell.cellIndex;

        if (pencilMarkMode) {
            togglePencilMark(selectedCell, value);
        } else {
            const requestBody = {
                board: sudokuData,
                row: row,
                col: col,
                value: value
            };

            fetch(`/isSafe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(isSafe => {
                if (isSafe) {
                    sudokuData[row][col] = value;
                    selectedCell.innerHTML = value;
                    selectedCell.classList.remove('pencil-mode'); // Remove pencil mark if cell is filled
                    clearPencilMarks(row, col, value);
                    clearHighlights();
                    selectedCell.classList.remove('selected');
                    selectedCell = null;
                    displayMessage('');
                    checkWin();
                } else {
                    displayMessage('Illegal move!');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }
}

function clearPencilMarks(row, col, value) {
    const sudokuGrid = document.getElementById('sudoku-grid');

    // Clear pencil marks in the row
    for (let i = 0; i < 9; i++) {
        const cell = sudokuGrid.rows[row].cells[i];
        if (cell.classList.contains('pencil-mode')) {
            const subCell = cell.getElementsByClassName('pencil-mark')[value - 1];
            subCell.textContent = '';
        }
    }

    // Clear pencil marks in the column
    for (let i = 0; i < 9; i++) {
        const cell = sudokuGrid.rows[i].cells[col];
        if (cell.classList.contains('pencil-mode')) {
            const subCell = cell.getElementsByClassName('pencil-mark')[value - 1];
            subCell.textContent = '';
        }
    }

    // Clear pencil marks in the 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
            const cell = sudokuGrid.rows[i].cells[j];
            if (cell.classList.contains('pencil-mode')) {
                const subCell = cell.getElementsByClassName('pencil-mark')[value - 1];
                subCell.textContent = '';
            }
        }
    }
}

function togglePencilMark(cell, value) {
    if (!cell.classList.contains('pencil-mode')) {
        cell.innerHTML = '';
        cell.classList.add('pencil-mode');
        for (let i = 1; i <= 9; i++) {
            const subCell = document.createElement('div');
            subCell.classList.add('pencil-mark');
            cell.appendChild(subCell);
        }
    }
    const subCells = cell.getElementsByClassName('pencil-mark');
    const subCell = subCells[value - 1];
    subCell.textContent = subCell.textContent === String(value) ? '' : value;
}

function checkWin() {
    fetch('/isWin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ board: sudokuData })
    })
    .then(response => response.json())
    .then(isWin => {
        if (isWin) {
            stopTimer();
            displayMessage('You win!');
        }
    })
    .catch(error => console.error('Error:', error));
}

function clearCell() {
    if (selectedCell && selectedCell.classList.contains('empty')) {
        const row = selectedCell.parentElement.rowIndex;
        const col = selectedCell.cellIndex;
        sudokuData[row][col] = 0;
        selectedCell.innerHTML = '';
        selectedCell.classList.remove('pencil-mode'); // Remove pencil mark when cell is cleared
        const subCells = selectedCell.getElementsByClassName('pencil-mark');
        for (let subCell of subCells) {
            subCell.textContent = '';
        }
        selectedCell.classList.remove('selected');
        clearHighlights();
        selectedCell = null;
    }
}

function displayMessage(message) {
    const messageContainer = document.getElementById('message-container');
    messageContainer.textContent = message;
}

function highlightCells(cell) {
    const row = cell.parentElement.rowIndex;
    const col = cell.cellIndex;
    const sudokuGrid = document.getElementById('sudoku-grid');

    // Highlight row and column
    for (let i = 0; i < 9; i++) {
        sudokuGrid.rows[row].cells[i].classList.add('highlight');
        sudokuGrid.rows[i].cells[col].classList.add('highlight');
    }

    // Highlight 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
            sudokuGrid.rows[i].cells[j].classList.add('highlight');
        }
    }
}

function highlightSameValues(cell) {
    const value = cell.textContent;
    if (value === '') return;

    const sudokuGrid = document.getElementById('sudoku-grid');
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const currentCell = sudokuGrid.rows[i].cells[j];
            if (!currentCell.classList.contains('pencil-mode') && currentCell.textContent === value) {
                highlightCells(currentCell);
            }
        }
    }
}

function clearHighlights() {
    const highlightedCells = document.querySelectorAll('.highlight');
    highlightedCells.forEach(cell => cell.classList.remove('highlight'));
}

function handleKeyDown(event) {
    const key = event.key;

    if (key === 'Shift') {
        //press shift to toggle pencil mode
        togglePencilMarkMode();
    }

    if (key >= '1' && key <= '9') {
        // Check if the key is a number between 1 and 9
        if (selectedCell && selectedCell.classList.contains('empty')) {
            fillCell(parseInt(key));
        }
    } else if (key === 'Backspace' || key === 'Delete') {
        // Clear the cell if Backspace or Delete is pressed
        clearCell();
    }
}
