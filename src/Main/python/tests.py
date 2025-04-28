import unittest
from src.Main.python.keerthy_code import Solution

class TestSolution(unittest.TestCase):
    
    def setUp(self):
        self.solution = Solution()

    def test_check_prime(self):
        self.assertTrue(self.solution.check_prime(2))
        self.assertTrue(self.solution.check_prime(3))
        self.assertFalse(self.solution.check_prime(4))
        self.assertTrue(self.solution.check_prime(5))
        self.assertFalse(self.solution.check_prime(9))
        self.assertTrue(self.solution.check_prime(11))
        self.assertFalse(self.solution.check_prime(15))
        self.assertTrue(self.solution.check_prime(17))

    def test_primeSubOperation(self):
        self.assertTrue(self.solution.primeSubOperation([10, 15, 20]))
        self.assertFalse(self.solution.primeSubOperation([10, 5, 20]))
        self.assertTrue(self.solution.primeSubOperation([5, 10, 15]))
        self.assertFalse(self.solution.primeSubOperation([20, 10, 5]))
        self.assertTrue(self.solution.primeSubOperation([2, 3, 5, 7, 11]))
        self.assertFalse(self.solution.primeSubOperation([1, 1, 1, 1, 1]))

if __name__ == '__main__':
    unittest.main()