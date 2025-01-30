def max_sliding_window(nums, k):
    if not nums:
        return []
    if k == 0:
        return nums

    from collections import deque
    deq = deque()
    result = []

    for i in range(len(nums)):
        # Remove elements not within the sliding window
        if deq and deq[0] < i - k + 1:
            deq.popleft()

        # Remove elements smaller than the current element
        while deq and nums[deq[-1]] < nums[i]:
            deq.pop()

        deq.append(i)

        # Append the maximum element of the current window
        if i >= k - 1:
            result.append(nums[deq[0]])

    return result    import unittest
    
    class TestSlidingWindow(unittest.TestCase):
        def test_max_sliding_window(self):
            self.assertEqual(max_sliding_window([1,3,-1,-3,5,3,6,7], 3), [3,3,5,5,6,7])
            self.assertEqual(max_sliding_window([1], 1), [1])
            self.assertEqual(max_sliding_window([1, -1], 1), [1, -1])
            self.assertEqual(max_sliding_window([9, 11], 2), [11])
            self.assertEqual(max_sliding_window([4, -2], 2), [4])
            self.assertEqual(max_sliding_window([], 0), [])
            self.assertEqual(max_sliding_window([1,3,1,2,0,5], 3), [3,3,2,5])
    
    if __name__ == '__main__':
        unittest.main()