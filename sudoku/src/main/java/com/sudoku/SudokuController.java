package com.sudoku;
import java.util.Random;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SudokuController {
    @GetMapping("/sudoku")
    public int[][] generateSudoku(@RequestParam(defaultValue = "9") int N, @RequestParam(defaultValue = "20") int K) {
        Sudoku sudoku = new Sudoku(N, K);
        sudoku.fillValues();
        return sudoku.mat;
    }

    @PostMapping("/isSafe")
    public boolean isSafe(@RequestBody SudokuRequest request) {
        int[][] board = request.getBoard();
        int row = request.getRow();
        int col = request.getCol();
        int value = request.getValue();

        Sudoku sudoku = new Sudoku(board.length, 0);
        sudoku.mat = board;
        return sudoku.CheckIfSafe(sudoku.mat, row, col, value);
    }

    @PostMapping("/isWin")
    public boolean isWin(@RequestBody SudokuRequest request) {
        int[][] board = request.getBoard();
        Sudoku sudoku = new Sudoku(board.length, 0);
        sudoku.mat = board;
        return sudoku.isWin();
    }

    static class Sudoku {
        int[][] mat;
        int N; // number of columns/rows.
        int SRN; // square root of N
        int K; // Number of blanks

        Sudoku(int N, int K) {
            this.N = N;
            this.K = K;
            Double SRNd = Math.sqrt(N);
            SRN = SRNd.intValue();
            mat = new int[N][N];
        }

        // Sudoku Generator
        public void fillValues() {
            fillDiagonal();
            fillRemaining(0, SRN);
            removeKDigits();
        }

        // Fill the diagonal SRN number of SRN x SRN matrices
        void fillDiagonal() {
            for (int i = 0; i < N; i = i + SRN)
                fillBox(i, i);
        }

        // check in the box for existence
        boolean unUsedInBox(int[][] mat, int rowStart, int colStart, int num) {
            for (int i = 0; i < SRN; i++)
                for (int j = 0; j < SRN; j++)
                    if (mat[rowStart + i][colStart + j] == num)
                        return false;
            return true;
        }

        // Fill a 3 x 3 matrix.
        void fillBox(int row, int col) {
            int num;
            for (int i = 0; i < SRN; i++) {
                for (int j = 0; j < SRN; j++) {
                    do {
                        num = (int) Math.floor((Math.random() * N + 1));
                    } while (!unUsedInBox(mat, row, col, num));
                    mat[row + i][col + j] = num;
                }
            }
        }

        // Check if safe to put in cell
        boolean CheckIfSafe(int[][] mat, int i, int j, int num) {
            return (unUsedInRow(mat, i, num) &&
                    unUsedInCol(mat, j, num) &&
                    unUsedInBox(mat, i - i % SRN, j - j % SRN, num));
        }

        // Check if the Sudoku board is completely filled
        public boolean isWin() {
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < N; j++) {
                    if (mat[i][j] == 0) {
                        return false;
                    }
                }
            }
            return true;
        }

        // check in the row for existence
        boolean unUsedInRow(int[][] mat, int i, int num) {
            for (int j = 0; j < N; j++)
                if (mat[i][j] == num)
                    return false;
            return true;
        }

        // check in the column for existence
        boolean unUsedInCol(int[][] mat, int j, int num) {
            for (int i = 0; i < N; i++)
                if (mat[i][j] == num)
                    return false;
            return true;
        }

        // A recursive function to fill remaining matrix
        boolean fillRemaining(int i, int j) {
            if (j >= N && i < N - 1) {
                i++;
                j = 0;
            }
            if (i >= N && j >= N)
                return true;

            if (i < SRN) {
                if (j < SRN)
                    j = SRN;
            } else if (i < N - SRN) {
                if (j == (i / SRN) * SRN)
                    j = j + SRN;
            } else {
                if (j == N - SRN) {
                    i++;
                    j = 0;
                    if (i >= N)
                        return true;
                }
            }

            for (int num = 1; num <= N; num++) {
                if (CheckIfSafe(mat, i, j, num)) {
                    mat[i][j] = num;
                    if (fillRemaining(i, j + 1))
                        return true;
                    mat[i][j] = 0;
                }
            }
            return false;
        }

        public void removeKDigits() {
            Random rand = new Random();
            int pairsToRemove = Math.floorDiv(K-10, 2);

            while (pairsToRemove > 0) {
                int row = rand.nextInt(N);
                int col = rand.nextInt(N);

                while (mat[row][col] == 0) {
                    row = rand.nextInt(N);
                    col = rand.nextInt(N);
                }

                int symRow = N - 1 - row;
                int symCol = N - 1 - col;

                // Ensure symmetry
                if (mat[symRow][symCol] == 0) {
                    continue;
                }

                // Backup numbers
                int backup1 = mat[row][col];
                int backup2 = mat[symRow][symCol];

                // Remove numbers
                mat[row][col] = 0;
                mat[symRow][symCol] = 0;

                if (!hasUniqueSolution()) {
                    // Restore numbers if the solution is not unique
                    mat[row][col] = backup1;
                    mat[symRow][symCol] = backup2;
                } else {
                    pairsToRemove--;
                    K -= 2;
                }
            }

            // Remove the remaining K numbers one by one
            while (K >= 0) {
                int row = rand.nextInt(N);
                int col = rand.nextInt(N);

                while (mat[row][col] == 0) {
                    row = rand.nextInt(N);
                    col = rand.nextInt(N);
                }

                int backup = mat[row][col];
                mat[row][col] = 0;

                if (!hasUniqueSolution()) {
                    mat[row][col] = backup;
                } else {
                    K--;
                }
            }
        }


        // Check if the Sudoku puzzle has a unique solution
        public boolean hasUniqueSolution() {
            int[][] copy = new int[N][N];
            for (int i = 0; i < N; i++) {
                System.arraycopy(mat[i], 0, copy[i], 0, N);
            }
            int solutions = countSolutions(copy);
            return solutions == 1;
        }

        // Count the number of solutions using backtracking
        public int countSolutions(int[][] board) {
            int row = -1;
            int col = -1;
            boolean isEmpty = true;
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < N; j++) {
                    if (board[i][j] == 0) {
                        row = i;
                        col = j;
                        isEmpty = false;
                        break;
                    }
                }
                if (!isEmpty) {
                    break;
                }
            }

            if (isEmpty) {
                return 1;
            }

            int count = 0;
            for (int num = 1; num <= N; num++) {
                if (CheckIfSafe(board, row, col, num)) {
                    board[row][col] = num;
                    count += countSolutions(board);
                    if (count > 1) {
                        break;
                    }
                    board[row][col] = 0;
                }
            }
            return count;
        }

        // Print sudoku
        public void printSudoku() {
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < N; j++)
                    System.out.print(mat[i][j] + " ");
                System.out.println();
            }
            System.out.println();
        }

        // test
        public static void main(String[] args) {
            int N = 9, K = 55;
            Sudoku sudoku = new Sudoku(N, K);
            sudoku.fillValues();
            sudoku.printSudoku();
        }
    }

}