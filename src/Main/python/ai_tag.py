def merge_two_lists(l1, l2):
    dummy = ListNode(0)
    current = dummy

    while l1 and l2:
        if l1.val < l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next

    if l1:
        current.next = l1
    else:
        current.next = l2

    return dummy.next





class TestMergeTwoLists(unittest.TestCase):
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

    def test_merge_two_lists(self):
        l1 = self.array_to_list([1, 2, 4])
        l2 = self.array_to_list([1, 3, 4])
        merged_head = merge_two_lists(l1, l2)
        self.assertEqual(self.list_to_array(merged_head), [1, 1, 2, 3, 4, 4])

if __name__ == '__main__':
    unittest.main()