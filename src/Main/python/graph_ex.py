from collections import deque

def bfs_shortest_path(graph, start, goal):
    """
    Finds the shortest path in an unweighted graph using BFS.
    
    :param graph: Dictionary representing the adjacency list of the graph
    :param start: The starting node
    :param goal: The goal node
    :return: List representing the shortest path from start to goal
    """
    if start == goal:
        return [start]
    
    visited = set()
    queue = deque([(start, [start])])
    
    while queue:
        (vertex, path) = queue.popleft()
        for next_node in graph[vertex]:
            if next_node not in visited:
                if next_node == goal:
                    return path + [next_node]
                else:
                    queue.append((next_node, path + [next_node]))
                visited.add(next_node)
    return None

# Test cases
def test_bfs_shortest_path():
    graph = {
        'A': ['B', 'C'],
        'B': ['A', 'D', 'E'],
        'C': ['A', 'F'],
        'D': ['B'],
        'E': ['B', 'F'],
        'F': ['C', 'E']
    }
    
    assert bfs_shortest_path(graph, 'A', 'F') == ['A', 'C', 'F']
    assert bfs_shortest_path(graph, 'A', 'D') == ['A', 'B', 'D']
    assert bfs_shortest_path(graph, 'A', 'A') == ['A']
    assert bfs_shortest_path(graph, 'D', 'F') == ['D', 'B', 'E', 'F']
    assert bfs_shortest_path(graph, 'A', 'G') == None  # Node 'G' does not exist

    print("All test cases pass")

if __name__ == "__main__":
    test_bfs_shortest_path()