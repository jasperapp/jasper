import unittest

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def remove_nth_from_end(head, n):
    dummy = ListNode(0)
    dummy.next = head
    first = dummy
    second = dummy

    for _ in range(n + 1):
        first = first.next
    

    while first is not None:
        first = first.next
        second = second.next

    second.next = second.next.next
    return dummy.next

class TestRemoveNthFromEnd(unittest.TestCase):
    def list_to_array(self, head):
        array = []
        while head:
            array.append(head.val)
            head = head.next
        return array

    def array_to_list(self, array):
        dummy = ListNode(0)
        current = dummy
        for val in array:
            current.next = ListNode(val)
            current = current.next
        return dummy.next


    def test_remove_nth_from_end(self):
        head = self.array_to_list([1, 2, 3, 4, 5])
        n = 2
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [1, 2, 3, 5])

    def test_remove_first_node(self):
        head = self.array_to_list([1, 2, 3, 4, 5])
        n = 5
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [2, 3, 4, 5])

    def test_remove_last_node(self):
        head = self.array_to_list([1, 2, 3, 4, 5])
        n = 1
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [1, 2, 3, 4])

    def test_single_node(self):
        head = self.array_to_list([1])
        n = 1
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [])

    def test_remove_middle_node(self):
        head = self.array_to_list([1, 2, 3, 4, 5, 6])
        n = 3
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [1, 2, 3, 5, 6])

    def test_remove_second_last_node(self):
        head = self.array_to_list([1, 2, 3, 4, 5])
        n = 2
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [1, 2, 3, 5])

    def test_remove_node_from_two_element_list(self):
        head = self.array_to_list([1, 2])
        n = 2
        new_head = remove_nth_from_end(head, n)
        self.assertEqual(self.list_to_array(new_head), [2])

if __name__ == '__main__':
    unittest.main()


