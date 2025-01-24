def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]
    
    left = merge_sort(left)
    right = merge_sort(right)
    
    return merge(left, right)

def merge(left, right):
    result = []
    left_idx = right_idx = 0
    
    while left_idx < len(left) and right_idx < len(right):
        if left[left_idx] < right[right_idx]:
            result.append(left[left_idx])
            left_idx += 1
        else:
            result.append(right[right_idx])
            right_idx += 1
    
    result.extend(left[left_idx:])
    result.extend(right[right_idx:])
    
    return result

import unittest

class TestMergeSort(unittest.TestCase):
    def test_merge_sort(self):
        arr = [38, 27, 43, 3, 9, 82, 10]
        sorted_arr = merge_sort(arr)
        self.assertEqual(sorted_arr, [3, 9, 10, 27, 38, 43, 82])

if __name__ == '__main__':
    unittest.main()