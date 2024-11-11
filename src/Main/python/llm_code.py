import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __lt__(self, other):
        return self.val < other.val

def mergeKLists(lists):
    min_heap = []
    
    # Initialize the heap with the head nodes of all lists
    for l in lists:
        if l:
            heapq.heappush(min_heap, l)
    
    dummy = ListNode()
    current = dummy
    
    while min_heap:
        # Extract the smallest node from the heap
        smallest_node = heapq.heappop(min_heap)
        current.next = smallest_node
        current = current.next
        
        # If the extracted node has a next node, insert it into the heap
        if smallest_node.next:
            heapq.heappush(min_heap, smallest_node.next)
    
    return dummy.next