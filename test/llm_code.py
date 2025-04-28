class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        last_node = self.head
        while last_node.next:
            last_node = last_node.next
        last_node.next = new_node

    def print_list(self):
        current_node = self.head
        while current_node:
            print(current_node.data, end=" -> ")
            current_node = current_node.next
        print("None")

    def join(self, other_list):
        if not self.head:
            self.head = other_list.head
            return
        last_node = self.head
        while last_node.next:
            last_node = last_node.next
        last_node.next = other_list.head

# Example usage:
ll1 = LinkedList()
ll1.append(1)
ll1.append(2)

ll2 = LinkedList()
ll2.append(3)
ll2.append(4)

ll3 = LinkedList()
ll3.append(5)
ll3.append(6)

# Join ll2 and ll3 to ll1
ll1.join(ll2)
ll1.join(ll3)

ll1.print_list()  # Output: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> None