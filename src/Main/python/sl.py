from typing import List

class Solution:
    def maxSumSubarray(self, nums: List[int], k: int) -> int:
        if not nums or k <= 0 or k > len(nums):
            return 0
        
        # Calculate the sum of the first window
        window_sum = sum(nums[:k])
        max_sum = window_sum
        
        # Slide the window from start to end of the array
        for i in range(len(nums) - k):
            # Subtract the element going out of the window and add the new element
            window_sum = window_sum - nums[i] + nums[i + k]
            max_sum = max(max_sum, window_sum)
        
        return max_sum

# Example usage
solution = Solution()
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
k = 3
print(solution.maxSumSubarray(nums, k))  # Output: 27 (sum of subarray [8, 9, 10])