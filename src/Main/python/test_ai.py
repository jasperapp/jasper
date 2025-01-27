def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1

# Test cases
arr = [1, 3, 5, 7, 9, 11, 13, 15]
target = 9
result = binary_search(arr, target)
print(f"Index of {target} in arr: {result}")

target = 4
result = binary_search(arr, target)
print(f"Index of {target} in arr: {result}")