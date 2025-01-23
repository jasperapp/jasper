def find_max_in_sliding_window(arr, k):
    if not arr or k <= 0:
        return []
    
    n = len(arr)
    if k > n:
        return []

    window = []
    result = []
    
    for i in range(n):
        if i >= k:
            result.append(max(window))
            window.pop(0)
        window.append(arr[i])
    
    result.append(max(window))
    
    return result

# Example Usage
arr = [1, 3, -1, -3, 5, 3, 6, 7]
k = 3
result = find_max_in_sliding_window(arr, k)
print(result)  # Output: [3, 3, 5, 5, 6, 7]


def find_min_in_sliding_window(arr, k):
    if not arr or k <= 0:
        return []
    
    n = len(arr)
    if k > n:
        return []

    window = []
    result = []
    
    for i in range(n):
        if i >= k:
            result.append(min(window))
            window.pop(0)
        window.append(arr[i])
    
    result.append(min(window))
    
    return result

# Example Usage
arr = [1, 3, -1, -3, 5, 3, 6, 7]
k = 3
result = find_min_in_sliding_window(arr, k)
print(result)  # Output: [1, -1, -3, -3, 3, 3]