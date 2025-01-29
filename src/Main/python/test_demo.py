# graph.py

class Graph:
    def __init__(self):
        self.graph = {}

    def add_edge(self, u, v):
        if u not in self.graph:
            self.graph[u] = []
        self.graph[u].append(v)

    def get_neighbors(self, u):
        return self.graph.get(u, [])

    def has_edge(self, u, v):
        return v in self.graph.get(u, [])        # test_graph.py
        import unittest
        from graph import Graph
        
        class TestGraph(unittest.TestCase):
            def setUp(self):
                self.graph = Graph()
        
            def test_add_edge(self):
                self.graph.add_edge(1, 2)
                self.assertIn(2, self.graph.get_neighbors(1))
        
            def test_get_neighbors(self):
                self.graph.add_edge(1, 2)
                self.graph.add_edge(1, 3)
                self.assertEqual(self.graph.get_neighbors(1), [2, 3])
        
            def test_has_edge(self):
                self.graph.add_edge(1, 2)
                self.assertTrue(self.graph.has_edge(1, 2))
                self.assertFalse(self.graph.has_edge(1, 3))
        
        if __name__ == '__main__':
            unittest.main()