def sliding_window(arr, k):
    if not arr or k <= 0:
        return []
    
    n = len(arr)
    if k > n:
        return []

    window = []
    result = []
    
    for i in range(n):
        if i >= k:
            result.append(window)
            window.pop(0)
        window.append(arr[i])
    
    result.append(window)
    
    return result

# Example Usage
arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]
k = 3
result = sliding_window(arr, k)
print(result)