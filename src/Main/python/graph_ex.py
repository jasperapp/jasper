# graph_ex.py

def search_string_in_list(lst, target):
    """
    Search for a string in a list.

    Parameters:
    lst (list): The list to search in.
    target (str): The string to search for.

    Returns:
    bool: True if the string is found, False otherwise.
    """
    return target in lst

# Test cases
import unittest

class TestSearchStringInList(unittest.TestCase):
    def test_string_found(self):
        self.assertTrue(search_string_in_list(['apple', 'banana', 'cherry'], 'banana'))

    def test_string_not_found(self):
        self.assertFalse(search_string_in_list(['apple', 'banana', 'cherry'], 'orange'))

    def test_empty_list(self):
        self.assertFalse(search_string_in_list([], 'banana'))

    def test_case_sensitivity(self):
        self.assertFalse(search_string_in_list(['apple', 'banana', 'cherry'], 'Banana'))

    def test_string_at_start(self):
        self.assertTrue(search_string_in_list(['apple', 'banana', 'cherry'], 'apple'))

    def test_string_at_end(self):
        self.assertTrue(search_string_in_list(['apple', 'banana', 'cherry'], 'cherry'))

if __name__ == '__main__':
    unittest.main()    # graph_ex.py
    
    def binary_search_string_in_list(lst, target):
        """
        Search for a string in a sorted list using binary search.
    
        Parameters:
        lst (list): The sorted list to search in.
        target (str): The string to search for.
    
        Returns:
        bool: True if the string is found, False otherwise.
        """
        left, right = 0, len(lst) - 1
        while left <= right:
            mid = (left + right) // 2
            if lst[mid] == target:
                return True
            elif lst[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return False
    
    # Test cases
    import unittest
    
    class TestBinarySearchStringInList(unittest.TestCase):
        def test_string_found(self):
            self.assertTrue(binary_search_string_in_list(['apple', 'banana', 'cherry'], 'banana'))
    
        def test_string_not_found(self):
            self.assertFalse(binary_search_string_in_list(['apple', 'banana', 'cherry'], 'orange'))
    
        def test_empty_list(self):
            self.assertFalse(binary_search_string_in_list([], 'banana'))
    
        def test_case_sensitivity(self):
            self.assertFalse(binary_search_string_in_list(['apple', 'banana', 'cherry'], 'Banana'))
    
        def test_string_at_start(self):
            self.assertTrue(binary_search_string_in_list(['apple', 'banana', 'cherry'], 'apple'))
    
    if __name__ == '__main__':
        unittest.main()