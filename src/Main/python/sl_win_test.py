def max_sum_subarray(arr, k):
    if k <= 0 or k > len(arr):
        return -1

    window_sum = sum(arr[:k])
    max_sum = window_sum

    for i in range(len(arr) - k):
        window_sum = window_sum - arr[i] + arr[i + k]
        max_sum = max(max_sum, window_sum)

    return max_sum

# Test the function with an example
arr = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
k = 3

import unittest

class TestMaxSumSubarray(unittest.TestCase):
    def test_positive_case(self):
        arr = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
        k = 3
        self.assertEqual(max_sum_subarray(arr, k), 16)

    def test_k_greater_than_array_length(self):
        arr = [4, 2, 1]
        k = 4
        self.assertEqual(max_sum_subarray(arr, k), -1)

    def test_k_is_zero(self):
        arr = [4, 2, 1]
        k = 0
        self.assertEqual(max_sum_subarray(arr, k), -1)

    def test_k_is_negative(self):
        arr = [4, 2, 1]
        k = -1
        self.assertEqual(max_sum_subarray(arr, k), -1)

    def test_empty_array(self):
        arr = []
        k = 3
        self.assertEqual(max_sum_subarray(arr, k), -1)
        def max_sum_subarray(arr, k):
            if k <= 0 or k > len(arr):
                return -1

            if not arr:
                return -1

            window_sum = sum(arr[:k])
            max_sum = window_sum

            for i in range(len(arr) - k):
                window_sum = window_sum - arr[i] + arr[i + k]
                max_sum = max(max_sum, window_sum)

            return max_sum

        # Test the function with an example
        arr = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
        k = 3


        class TestMaxSumSubarray(unittest.TestCase):
            def test_positive_case(self):
                arr = [4, 2, 1, 7, 8, 1, 2, 8, 1, 0]
                k = 3
                self.assertEqual(max_sum_subarray(arr, k), 16)

            def test_k_greater_than_array_length(self):
                arr = [4, 2, 1]
                k = 4
                self.assertEqual(max_sum_subarray(arr, k), -1)

            def test_k_is_zero(self):
                arr = [4, 2, 1]
                k = 0
                self.assertEqual(max_sum_subarray(arr, k), -1)

            def test_k_is_negative(self):
                arr = [4, 2, 1]
                k = -1
                self.assertEqual(max_sum_subarray(arr, k), -1)

            def test_empty_array(self):
                arr = []
                k = 3
                self.assertEqual(max_sum_subarray(arr, k), -1)

    def test_single_element_array(self):
        arr = [5]
        k = 1
        self.assertEqual(max_sum_subarray(arr, k), 5)

    def test_all_elements_same(self):
        arr = [1, 1, 1, 1, 1]
        k = 2
        self.assertEqual(max_sum_subarray(arr, k), 2)

            def test_large_k(self):
                arr = [1, 2, 3, 4, 5]
                k = 5
                self.assertEqual(max_sum_subarray(arr, k), 15)

            def test_large_array(self):
                arr = list(range(10000))
                k = 100
                self.assertEqual(max_sum_subarray(arr, k), sum(range(9900, 10000)))

if __name__ == '__main__':
    unittest.main()
result = max_sum_subarray(arr, k)
print("The maximum sum of a subarray of size", k, "is:", result)