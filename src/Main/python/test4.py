# Example usage of the merge_sort function
arr = [38, 27, 43, 3, 9, 82, 10]
print("Original array:", arr)

sorted_arr = merge_sort(arr)
print("Sorted array:", sorted_arr)


# Additional test cases for the merge_sort function

# Test case with an empty list
arr_empty = []
print("Original array (empty):", arr_empty)
sorted_arr_empty = merge_sort(arr_empty)
print("Sorted array (empty):", sorted_arr_empty)

# Test case with a list of one element
arr_one_element = [5]
print("Original array (one element):", arr_one_element)
sorted_arr_one_element = merge_sort(arr_one_element)
print("Sorted array (one element):", sorted_arr_one_element)

# Test case with a list already sorted in ascending order
arr_ascending = [1, 2, 3, 4, 5]
print("Original array (ascending):", arr_ascending)
sorted_arr_ascending = merge_sort(arr_ascending)
print("Sorted array (ascending):", sorted_arr_ascending)

# Test case with a list sorted in descending order
arr_descending = [5, 4, 3, 2, 1]
print("Original array (descending):", arr_descending)
sorted_arr_descending = merge_sort(arr_descending)
print("Sorted array (descending):", sorted_arr_descending)