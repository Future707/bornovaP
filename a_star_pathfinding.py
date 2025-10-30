"""
A* Pathfinding Algorithm Implementation
Grid-based pathfinding using A-Star algorithm with random corridor generation.
"""

import random
import heapq


class Node:
    """
    Node sınıfı - Grid üzerindeki her hücreyi temsil eder.
    """
    def __init__(self, position, is_corridor=True):
        self.position = position  # (x, y) tuple
        self.is_corridor = is_corridor  # Geçilebilir mi?
        self.g_cost = float('inf')  # Başlangıçtan bu düğüme maliyet
        self.h_cost = 0  # Bu düğümden hedefe tahmini maliyet (heuristic)
        self.f_cost = float('inf')  # g_cost + h_cost
        self.parent = None  # Yolu yeniden oluşturmak için

    def __lt__(self, other):
        """Heapq için karşılaştırma - f_cost'a göre"""
        return self.f_cost < other.f_cost

    def __repr__(self):
        return f"Node({self.position}, corridor={self.is_corridor})"


class Grid:
    """
    Grid sınıfı - 2D düğüm ağını yönetir.
    """
    def __init__(self, width, height, density=0.65):
        self.width = width
        self.height = height
        self.grid = self._create_random_grid(density)

    def _create_random_grid(self, density):
        """
        Rastgele koridor ve duvarlardan oluşan bir grid oluşturur.

        Args:
            density: Koridor yoğunluğu (0.0 - 1.0)

        Returns:
            2D liste of Node nesneleri
        """
        grid = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                # Rastgele koridor veya duvar belirle
                is_corridor = random.random() < density
                node = Node(position=(x, y), is_corridor=is_corridor)
                row.append(node)
            grid.append(row)
        return grid

    def get_node(self, x, y):
        """
        Güvenli düğüm erişimi.

        Args:
            x, y: Koordinatlar

        Returns:
            Node veya None (sınırlar dışındaysa)
        """
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.grid[y][x]
        return None

    def get_neighbors(self, node):
        """
        Bir düğümün geçilebilir komşularını döndürür (sadece 4 yön: yukarı, aşağı, sol, sağ).

        Args:
            node: Node nesnesi

        Returns:
            Geçilebilir komşu Node listesi
        """
        x, y = node.position
        neighbors = []

        # 4 yön: yukarı, aşağı, sol, sağ
        directions = [
            (0, -1),  # Yukarı
            (0, 1),   # Aşağı
            (-1, 0),  # Sol
            (1, 0)    # Sağ
        ]

        for dx, dy in directions:
            neighbor_node = self.get_node(x + dx, y + dy)
            # Geçerli ve koridor olan komşuları ekle
            if neighbor_node and neighbor_node.is_corridor:
                neighbors.append(neighbor_node)

        return neighbors


def heuristic(a, b):
    """
    Manhattan mesafesi heuristic fonksiyonu.

    Args:
        a, b: (x, y) tuple pozisyonlar

    Returns:
        Manhattan mesafesi
    """
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def reconstruct_path(end_node):
    """
    Parent bağlantılarını takip ederek yolu yeniden oluşturur.

    Args:
        end_node: Hedef Node nesnesi

    Returns:
        Başlangıçtan hedefe koordinat listesi
    """
    path = []
    current = end_node

    while current is not None:
        path.append(current.position)
        current = current.parent

    # Başlangıçtan hedefe sırala
    path.reverse()
    return path


def find_path_a_star(grid, start_pos, end_pos):
    """
    A* algoritması ile iki nokta arasındaki en kısa yolu bulur.

    Args:
        grid: Grid nesnesi
        start_pos: Başlangıç pozisyonu (x, y)
        end_pos: Bitiş pozisyonu (x, y)

    Returns:
        Yol (koordinat listesi) veya None (yol bulunamazsa)
    """
    start_node = grid.get_node(*start_pos)
    end_node = grid.get_node(*end_pos)

    # Başlangıç ve bitiş noktalarının geçerli olup olmadığını kontrol et
    if not start_node or not start_node.is_corridor:
        print(f"Hata: Başlangıç noktası ({start_pos}) koridor değil!")
        return None

    if not end_node or not end_node.is_corridor:
        print(f"Hata: Bitiş noktası ({end_pos}) koridor değil!")
        return None

    # Başlangıç düğümünü başlat
    start_node.g_cost = 0
    start_node.h_cost = heuristic(start_pos, end_pos)
    start_node.f_cost = start_node.h_cost

    # Öncelik kuyruğu (heap) - f_cost'a göre sıralı
    open_set = []
    heapq.heappush(open_set, start_node)

    # Ziyaret edilen düğümleri takip et
    closed_set = set()

    while open_set:
        # En düşük f_cost'a sahip düğümü al
        current_node = heapq.heappop(open_set)

        # Hedefe ulaştık mı?
        if current_node.position == end_pos:
            return reconstruct_path(current_node)

        # Bu düğümü ziyaret edildi olarak işaretle
        closed_set.add(current_node.position)

        # Komşuları incele
        for neighbor in grid.get_neighbors(current_node):
            # Zaten ziyaret edildiyse atla
            if neighbor.position in closed_set:
                continue

            # Yeni g_cost hesapla (her adım 1 birim)
            tentative_g_cost = current_node.g_cost + 1

            # Daha iyi bir yol bulduysak güncelle
            if tentative_g_cost < neighbor.g_cost:
                neighbor.parent = current_node
                neighbor.g_cost = tentative_g_cost
                neighbor.h_cost = heuristic(neighbor.position, end_pos)
                neighbor.f_cost = neighbor.g_cost + neighbor.h_cost

                # Komşu henüz open_set'te değilse ekle
                if neighbor not in open_set:
                    heapq.heappush(open_set, neighbor)

    # Yol bulunamadı
    return None


def visualize_grid(grid, path=None, start_pos=None, end_pos=None):
    """
    Grid'i görselleştirir.

    Args:
        grid: Grid nesnesi
        path: Yol koordinatları (opsiyonel)
        start_pos: Başlangıç pozisyonu (opsiyonel)
        end_pos: Bitiş pozisyonu (opsiyonel)
    """
    path_set = set(path) if path else set()

    print("\nGrid Görselleştirme:")
    print("=" * (grid.width + 2))

    for y in range(grid.height):
        row_str = ""
        for x in range(grid.width):
            pos = (x, y)
            node = grid.get_node(x, y)

            if pos == start_pos:
                row_str += "B"  # Başlangıç
            elif pos == end_pos:
                row_str += "E"  # Bitiş
            elif pos in path_set:
                row_str += "P"  # Yol
            elif node.is_corridor:
                row_str += "."  # Koridor
            else:
                row_str += "#"  # Duvar

        print(row_str)

    print("=" * (grid.width + 2))
    print("\nLegend: B=Başlangıç, E=Bitiş, P=Yol, .=Koridor, #=Duvar")


if __name__ == '__main__':
    # Grid boyutları
    WIDTH = 20
    HEIGHT = 15

    # Başlangıç ve bitiş noktaları
    START = (0, 0)
    END = (19, 14)

    print("A* Pathfinding Algoritması")
    print(f"Grid Boyutu: {WIDTH}x{HEIGHT}")
    print(f"Başlangıç: {START}")
    print(f"Bitiş: {END}")

    # Grid oluştur
    grid = Grid(WIDTH, HEIGHT, density=0.65)

    # Başlangıç ve bitiş noktalarının koridor olduğundan emin ol
    grid.grid[START[1]][START[0]].is_corridor = True
    grid.grid[END[1]][END[0]].is_corridor = True

    # A* ile yolu bul
    print("\nYol aranıyor...")
    path = find_path_a_star(grid, START, END)

    if path:
        print(f"\nYol bulundu! Uzunluk: {len(path)} adım")
        print(f"Yol: {path[:5]}... (ilk 5 adım)" if len(path) > 5 else f"Yol: {path}")
        visualize_grid(grid, path, START, END)
    else:
        print("\nYol bulunamadı!")
        print("Grid görünümü (başlangıç ve bitiş noktaları işaretli):")
        visualize_grid(grid, None, START, END)
