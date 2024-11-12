def searchMatrix(matrix, target):
    if not matrix or not matrix[0]:
        return False

    rows, cols = len(matrix), len(matrix[0])
    row, col = 0, cols - 1

    while row < rows and col >= 0:
        if matrix[row][col] == target:
            return True
        elif matrix[row][col] > target:
            col -= 1
        else:
            row += 1

    return False


import unittest

class TestSearchMatrix(unittest.TestCase):
    def test_target_found(self):
        matrix = [
            [1, 4, 7, 11, 15],
            [2, 5, 8, 12, 19],
            [3, 6, 9, 16, 22],
            [10, 13, 14, 17, 24],
            [18, 21, 23, 26, 30]
        ]
        target = 5
        self.assertTrue(searchMatrix(matrix, target))

    def test_target_not_found(self):
        matrix = [
            [1, 4, 7, 11, 15],
            [2, 5, 8, 12, 19],
            [3, 6, 9, 16, 22],
            [10, 13, 14, 17, 24],
            [18, 21, 23, 26, 30]
        ]
        target = 20
        self.assertFalse(searchMatrix(matrix, target))

    def test_empty_matrix(self):
        matrix = []
        target = 1
        self.assertFalse(searchMatrix(matrix, target))

    def test_single_element_matrix_found(self):
        matrix = [[1]]
        target = 1
        self.assertTrue(searchMatrix(matrix, target))

    def test_single_element_matrix_not_found(self):
        matrix = [[1]]
        target = 2
        self.assertFalse(searchMatrix(matrix, target))

if __name__ == '__main__':
    unittest.main()