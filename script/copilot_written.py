def max_product_subarray(nums):
    if not nums:
        return []

    max_product = nums[0]
    min_product = nums[0]
    result = nums[0]
    start = end = s = 0

    for i in range(1, len(nums)):
        if nums[i] < 0:
            max_product, min_product = min_product, max_product

        max_product = max(nums[i], max_product * nums[i])
        min_product = min(nums[i], min_product * nums[i])

        if max_product > result:
            result = max_product
            start = s
            end = i

        if max_product == nums[i]:
            s = i

    return nums[start:end + 1]

# Example usage:
nums = [2, 3, -2, 4]
print(max_product_subarray(nums))  # Output: [2, 3]
