def merge_sort(arr):
    """
    Merge sorts an array of integers.

    Parameters:
    - arr (list): The array to be sorted.

    Returns:
    - sorted_arr (list): The sorted array.
    """
    if len(arr) <= 1:
        return arr

    # Split the array into two halves
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]

    # Recursively sort the left and right halves
    left_sorted = merge_sort(left)
    right_sorted = merge_sort(right)

    # Merge the sorted halves into a single sorted array
    merged = merge(left_sorted, right_sorted)
