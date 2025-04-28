import unittest
from keerthy_code import Solution

class TestSolution(unittest.TestCase):
    def setUp(self):
        self.solution = Solution()

    def test_check_prime(self):
        # Test prime numbers
        self.assertTrue(self.solution.check_prime(2))
        self.assertTrue(self.solution.check_prime(3))
        self.assertTrue(self.solution.check_prime(5))
        self.assertTrue(self.solution.check_prime(7))
        self.assertTrue(self.solution.check_prime(11))
        
        # Test non-prime numbers
        self.assertFalse(self.solution.check_prime(1))
        self.assertFalse(self.solution.check_prime(4))
        self.assertFalse(self.solution.check_prime(6))
        self.assertFalse(self.solution.check_prime(8))
        self.assertFalse(self.solution.check_prime(9))
        self.assertFalse(self.solution.check_prime(10))

    def test_primeSubOperation(self):
        # Test cases where the operation should return True
        self.assertTrue(self.solution.primeSubOperation([10, 15, 20]))
        self.assertTrue(self.solution.primeSubOperation([5, 10, 15]))
        self.assertTrue(self.solution.primeSubOperation([2, 3, 5, 7, 11]))
        
        # Test cases where the operation should return False
        self.assertFalse(self.solution.primeSubOperation([10, 5, 20]))
        self.assertFalse(self.solution.primeSubOperation([20, 15, 10]))
        self.assertFalse(self.solution.primeSubOperation([1, 1, 1]))

if __name__ == '__main__':
    unittest.main()