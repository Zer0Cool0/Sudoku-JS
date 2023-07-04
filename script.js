$(document).ready(async function () {
  var grid = [];
  var selectedCell = null; // New variable to store selected cell
  var percentage;
  var label

  await $('#start').on('click', function () {
    var menuChoice = $('#menuSelect').val(); // Get the selected menu choice

    switch (menuChoice) {
      case "very_easy":
        percentage = 0.85;
        label = "Very Easy"
        break;
      case "easy":
        percentage = 0.70;
        label = "Easy"
        break;
      case "normal":
        percentage = 0.65;
        label = "Normal"
        break;
      case "hard":
        percentage = 0.50;
        label = "Hard"
        break;
      case "very_hard":
        percentage = 0.35;
        label = "Very Hard"
        break;
      case "impossible":
        percentage = 0.15;
        label = "Impossible"
        break;
      default:
        percentage = 0.65;
        label = "Normal"
        break;
    }

    $('.game-container').show();
    $('.Menu').hide();

    $('#difficulty-value').html(label);

    console.log(`User selected ${menuChoice} with percentage ${percentage}`);
  });

  // while percentage == null or undefined wait for user to select a difficulty
  while (percentage == null || percentage == undefined) {
    console.log("Waiting for user to select a difficulty")
    await new Promise(r => setTimeout(r, 500));
  }

  generateGrid(percentage);
  // Generate the number selection row
  generateNumberRow();
  // Render the initial grid
  renderGrid();

  startTimer();

  var time = 0;
  function startTimer() {
    setInterval(function () {
      time++;
      var minutes = Math.floor(time / 60);
      var seconds = time % 60;
      if (seconds < 10) {
        seconds = '0' + seconds;
      }
      var formattedTime = minutes + ':' + seconds;
      $('#time-value').html(formattedTime);
    }, 1000); // Update the timer every second (1000 milliseconds)
  }

  function stopTimer() {
    EndTime = $('#time-value').html();
    time = 0

    return EndTime;
  }

  // Global variable to store the history of actions
  var actionHistory = [];

  // Handle click event on "Undo" button
  $('#undo-button').on('click', function () {
    if (actionHistory.length > 0) {
      var lastAction = actionHistory.pop();

      // Perform the opposite action to undo the last move
      if (lastAction.type === 'fill') {
        var row = lastAction.row;
        var col = lastAction.col;
        grid[row][col] = 0;

        // Update the selected cell to the undone cell
        selectedCell = $('tr').eq(row).find('td').eq(col);
      } else if (lastAction.type === 'erase') {
        var row = lastAction.row;
        var col = lastAction.col;
        var value = lastAction.value;
        grid[row][col] = value;

        // Update the selected cell to the undone cell
        selectedCell = $('tr').eq(row).find('td').eq(col);
      }

      // Remove highlighting from previously selected cell
      if (selectedCell !== null) {
        $('td').removeClass('selected');
        selectedCell.addClass('selected');
        $('td').removeClass('incorrect');
      }

      // Remove highlighting from all cells except for the undone cell
      $('td').not(selectedCell).removeClass('highlight-row highlight-col highlight-number highlight-grid');
      $('td').removeClass(function (index, className) {
        return (className.match(/(^|\s)highlight-\S+/g) || []).join(' ');
      });

      // Add row and column classes to highlight the corresponding cells
      var row = selectedCell.parent().index();
      var col = selectedCell.index();
      $('tr').eq(row).find('td').addClass('highlight-row');
      $('tr td:nth-child(' + (col + 1) + ')').addClass('highlight-col');

      // Calculate the grid indices
      var gridStartRow = Math.floor(row / 3) * 3;
      var gridStartCol = Math.floor(col / 3) * 3;

      // Add grid class to highlight the cells in the same grid
      $('tr').slice(gridStartRow, gridStartRow + 3).each(function () {
        $(this).find('td').slice(gridStartCol, gridStartCol + 3).addClass('highlight-grid');
      });

      renderGrid();

      var numberrow = $('#number-row');
      numberrow.find('button').each(function () {
        if ($(this).prop('disabled')) {
          var numberOccurrences = countNumberOccurrences();
          if (numberOccurrences[$(this).text()] < 9) {
            $(this).prop('disabled', false);
          }
        }
      });
    }
  });

  // Handle click events on cells
  $('td').on('click', function () {
    console.log('Cell clicked')
    // Remove selected class from previously selected cell
    if (selectedCell !== null) {
      selectedCell.removeClass('selected');
    }

    // Remove row, column, number, and grid classes from previously selected cells
    $('td').removeClass('highlight-row highlight-col highlight-number highlight-grid');

    // Get row and column indices of clicked cell
    var row = $(this).parent().index();
    var col = $(this).index();

    // Set selectedCell to the clicked cell and add selected class
    selectedCell = $(this);
    selectedCell.addClass('selected');

    // Add row and column classes to highlight the corresponding cells
    $('tr').eq(row).find('td').addClass('highlight-row');
    $('tr td:nth-child(' + (col + 1) + ')').addClass('highlight-col');

    // Get the number of the selected cell
    var number = parseInt(selectedCell.text());

    // Add number class to highlight the cells with the same number
    $('td').filter(function () {
      return parseInt($(this).text()) === number;
    }).addClass('highlight-number');

    // Calculate the grid indices
    var gridStartRow = Math.floor(row / 3) * 3;
    var gridStartCol = Math.floor(col / 3) * 3;

    // Add grid class to highlight the cells in the same grid
    $('tr').slice(gridStartRow, gridStartRow + 3).each(function () {
      $(this).find('td').slice(gridStartCol, gridStartCol + 3).addClass('highlight-grid');
    });
  });


  // Handle click event on the number buttons
  $('#number-row button').on('click', function () {
    // Check if the selected cell is writable
    if (selectedCell !== null && !selectedCell.hasClass('given')) {
      var number = parseInt($(this).text());

      $('td').filter(function () {
        return parseInt($(this).text()) === number;
      }).addClass('highlight-number');

      // Get the row and column indices of the selected cell
      var row = selectedCell.parent().index();
      var col = selectedCell.index();

      // Check if the selected number is correct for the current cell
      var isCorrect = isValidMove(row, col, number);

      // Store the previous value in the action history before updating the cell
      var previousValue = grid[row][col];
      var action = {
        type: 'fill',
        row: row,
        col: col,
        value: previousValue
      };
      actionHistory.push(action);

      // Update the cell value in the grid
      grid[row][col] = number;

      if (!isCorrect) {
        // Add wrong class to highlight the cell
        selectedCell.addClass('incorrect');
        var mistakesElement = $('#mistakes-value').text();
        $('#mistakes-value').text(parseInt(mistakesElement) + 1);
      }

      renderGrid();

      // Count the occurrences of the selected number in the grid
      var numberOccurrences = countNumberOccurrences();

      // Disable the button if the maximum occurrences have been reached
      if (numberOccurrences[number] >= 9) {
        $(this).prop('disabled', true);
      }
    }

    // if there are no more empty cells and no cells have the incorrect class
    if (isSolved() && !$('td').hasClass('incorrect')) {
      showEndScreen();
    }

  });

  function isSolved() {
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        var number = grid[i][j];
        if (number === 0) {
          return false;
        }
      }
    }
    return true;
  }

  // Function to generate the number selection row
  function generateNumberRow() {
    var numberRow = $('#number-row');
    var numberOccurrences = countNumberOccurrences(); // Count the occurrences of each number in the grid

    for (var i = 1; i <= 9; i++) {
      var button = $('<button></button>').text(i);

      // Disable the number button if the maximum occurrences have been reached
      if (numberOccurrences[i] >= 9) {
        button.prop('disabled', true);
      }

      numberRow.append(button);
    }
  }

  // Function to count the occurrences of each number in the grid
  function countNumberOccurrences() {
    var numberOccurrences = new Array(10).fill(0);

    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        var number = grid[i][j];
        numberOccurrences[number]++;
      }
    }

    return numberOccurrences;
  }

  // Handle click event on the "Check" button
  $('#check-button').on('click', function () {
    if (checkSolution()) {
      alert('Congratulations! Sudoku solved correctly.');
    } else {
      alert('Oops! There are some errors in the solution.');
    }
  });

  // Function to generate a Sudoku grid
  function generateGrid(fillPercentage) {
    // Clear the existing grid
    $("#sudoku-board").empty();

    // Generate a new Sudoku grid
    grid = [];
    for (var i = 0; i < 9; i++) {
      var row = [];
      for (var j = 0; j < 9; j++) {
        row.push(0);
      }
      grid.push(row);
    }

    // Solve the Sudoku grid
    solveSudoku(grid);

    // Remove cells to achieve desired fill percentage
    removeCells(grid, fillPercentage); // 30% fill percentage

    // Generate the HTML grid
    var table = $("#sudoku-board");
    for (var i = 0; i < 9; i++) {
      var tr = $("<tr></tr>");
      for (var j = 0; j < 9; j++) {
        var value = grid[i][j];
        var cellId = "cell-" + i + "-" + j;
        var inputId = "input-" + i + "-" + j;
        var cellClass = "cell";
        if (i === 2 || i === 5) {
          cellClass += " bottom-border";
        }
        if (j === 2 || j === 5) {
          cellClass += " right-border";
        }
        var td = $('<td></td>').attr('id', cellId).addClass(cellClass);
        var input = $('<input></input>').attr({
          'id': inputId,
          'type': 'text',
          'maxlength': '1'
        });

        // Check if the cell is given (not removed) and make it unchangeable
        if (value !== 0) {
          td.text(value); // Corrected this line
          td.addClass('given'); // Corrected this line
          input.prop({
            'readonly': true,
            'value': value
          });
        } else {
          td.text(''); // Corrected this line
          td.removeClass('given'); // Corrected this line
          input.prop('readonly', false);
        }

        td.append(input);
        tr.append(td);
      }
      table.append(tr);
    }
  }

  // Function to remove cells to achieve desired fill percentage
  function removeCells(grid, fillPercentage) {
    var totalCells = 81;
    var cellsToRemove = Math.floor(totalCells * (1 - fillPercentage));
    var cellsRemoved = 0;

    while (cellsRemoved < cellsToRemove) {
      var row = Math.floor(Math.random() * 9);
      var col = Math.floor(Math.random() * 9);
      if (grid[row][col] !== 0) {
        grid[row][col] = 0;
        cellsRemoved++;
      }
    }
  }

  // Function to check if the Sudoku solution is correct
  function checkSolution() {
    // Check rows and columns
    for (var i = 0; i < 9; i++) {
      var rowValues = [];
      var colValues = [];
      for (var j = 0; j < 9; j++) {
        if (rowValues.includes(grid[i][j]) || colValues.includes(grid[j][i])) {
          return false;
        }
        rowValues.push(grid[i][j]);
        colValues.push(grid[j][i]);
      }
    }

    // Check 3x3 boxes
    for (var boxRow = 0; boxRow < 9; boxRow += 3) {
      for (var boxCol = 0; boxCol < 9; boxCol += 3) {
        var boxValues = [];
        for (var i = boxRow; i < boxRow + 3; i++) {
          for (var j = boxCol; j < boxCol + 3; j++) {
            if (boxValues.includes(grid[i][j])) {
              return false;
            }
            boxValues.push(grid[i][j]);
          }
        }
      }
    }

    return true;
  }

// Function to solve the Sudoku using backtracking with randomization
function solveSudoku() {
  var emptyCells = findEmptyCells();

  if (emptyCells.length === 0) {
    return true; // All cells filled, Sudoku solved
  }

  var randomOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleArray(randomOrder);

  var cell = emptyCells[0]; // Select the first empty cell
  var row = cell.row;
  var col = cell.col;

  for (var i = 0; i < randomOrder.length; i++) {
    var num = randomOrder[i];
    if (isValidMove(row, col, num)) {
      grid[row][col] = num;

      if (solveSudoku()) {
        return true;
      }

      grid[row][col] = 0;
    }
  }

  return false;
}

// Helper function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// Function to find all empty cells in the Sudoku grid
function findEmptyCells() {
  var emptyCells = [];

  for (var row = 0; row < 9; row++) {
    for (var col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        emptyCells.push({ row: row, col: col });
      }
    }
  }

  return emptyCells;
}

  // Function to check if a move is valid in the Sudoku grid
  function isValidMove(row, col, num) {
    // Check row
    for (var i = 0; i < 9; i++) {
      if (grid[row][i] === num) {
        return false;
      }
    }

    // Check column
    for (var i = 0; i < 9; i++) {
      if (grid[i][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    var boxRow = Math.floor(row / 3) * 3;
    var boxCol = Math.floor(col / 3) * 3;
    for (var i = boxRow; i < boxRow + 3; i++) {
      for (var j = boxCol; j < boxCol + 3; j++) {
        if (grid[i][j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  // Function to render the Sudoku grid
  function renderGrid() {
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        var cellId = "cell-" + i + "-" + j;
        var inputId = "input-" + i + "-" + j;
        var value = grid[i][j];
        var cell = $('#' + cellId);
        var input = $('#' + inputId);

        if (value !== 0) {
          cell.text(value);
          cell.addClass('given');
          input.prop('readonly', true);
        } else {
          cell.text('');
          cell.removeClass('given');
          input.prop('readonly', false);
        }
      }
    }
  }

  // Function to show the end screen
  function showEndScreen() {
    $('.game-container').hide();
    $('#end-screen').show();
    $('p').html('You solved the sudoku in ' + $('#time-value').html() + '!');
  }

  // Handle click event on the "Play Again" button
  $('#play-again').on('click', function () {
    location.reload();
  });
});
