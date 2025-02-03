class Graph:
    def __init__(self):
        self.graph = {}

    def add_edge(self, u, v):
        if u not in self.graph:
            self.graph[u] = []
        self.graph[u].append(v)

    def dfs_util(self, v, visited):
        visited.add(v)
        print(v, end=' ')

        for neighbor in self.graph.get(v, []):
            if neighbor not in visited:
                self.dfs_util(neighbor, visited)

    def dfs(self, v):
        visited = set()
        self.dfs_util(v, visited)        import unittest
        
        class TestGraphDFS(unittest.TestCase):
            def setUp(self):
                self.graph = Graph()
                self.graph.add_edge(0, 1)
                self.graph.add_edge(0, 2)
                self.graph.add_edge(1, 2)
                self.graph.add_edge(2, 0)
                self.graph.add_edge(2, 3)
                self.graph.add_edge(3, 3)
        
            def test_dfs(self):
                from io import StringIO
                import sys
        
                # Capture the output of the DFS
                captured_output = StringIO()
                sys.stdout = captured_output
                self.graph.dfs(2)
                sys.stdout = sys.__stdout__
        
                # Check if the output is as expected
                self.assertEqual(captured_output.getvalue().strip(), "2 0 1 3")
        
        if __name__ == '__main__':
            unittest.main()