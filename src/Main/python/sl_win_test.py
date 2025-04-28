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
result = max_sum_subarray(arr, k)
print("The maximum sum of a subarray of size", k, "is:", result)