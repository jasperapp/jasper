from collections import deque

def bfs_shortest_path(graph, start, goal):
    # Keep track of explored nodes
    explored = []
    # Keep track of all the paths to be checked
    queue = deque([[start]])
    
    # Return path if start is goal
    if start == goal:
        return [start]
    
    # Keep looping until all possible paths have been checked
    while queue:
        # Pop the first path from the queue
        path = queue.popleft()
        # Get the last node from the path
        node = path[-1]
        if node not in explored:
            neighbours = graph[node]
            # Go through all neighbour nodes, construct a new path and push it into the queue
            for neighbour in neighbours:
                new_path = list(path)
                new_path.append(neighbour)
                queue.append(new_path)
                # Return path if neighbour is goal
                if neighbour == goal:
                    return new_path
            # Mark node as explored
            explored.append(node)
    
    # In case there's no path between the 2 nodes
    return None

# Example graph represented as an adjacency list
graph = {
    'A': ['B', 'C', 'E'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F', 'G'],
    'D': ['B'],
    'E': ['A', 'B', 'D'],
    'F': ['C'],
    'G': ['C']
}

# Test cases
def test_bfs_shortest_path():
    assert bfs_shortest_path(graph, 'A', 'D') == ['A', 'B', 'D']
    assert bfs_shortest_path(graph, 'A', 'G') == ['A', 'C', 'G']
    assert bfs_shortest_path(graph, 'A', 'A') == ['A']
    assert bfs_shortest_path(graph, 'D', 'G') == ['D', 'B', 'A', 'C', 'G']
    assert bfs_shortest_path(graph, 'G', 'D') == ['G', 'C', 'A', 'B', 'D']
    assert bfs_shortest_path(graph, 'A', 'H') == None  # Node 'H' does not exist in the graph

# Run test cases
if __name__ == "__main__":
    test_bfs_shortest_path()
    print("All tests passed.")