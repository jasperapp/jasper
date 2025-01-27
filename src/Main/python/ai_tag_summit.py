def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < n and arr[i] < arr[left]:
        largest = left

    if right < n and arr[largest] < arr[right]:
        largest = right

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    n = len(arr)

    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    for i in range(n-1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        heapify(arr, i, 0)

    return arr

    import unittest

class TestHeapSort(unittest.TestCase):
    def test_heap_sort(self):
        self.assertEqual(heap_sort([4, 10, 3, 5, 1]), [1, 3, 4, 5, 10])
        self.assertEqual(heap_sort([0, 0, 0, 0, 0]), [0, 0, 0, 0, 0])
        self.assertEqual(heap_sort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5])
        self.assertEqual(heap_sort([1, 2, 3, 4, 5]), [1, 2, 3, 4, 5])
        self.assertEqual(heap_sort([]), [])

if __name__ == '__main__':
    unittest.main()