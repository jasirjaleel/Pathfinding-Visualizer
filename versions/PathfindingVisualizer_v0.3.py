import pygame
import sys
from queue import PriorityQueue
import math

pygame.init()

window_width = 500
header_height = 50
button_space = 20
total_top_space = header_height + button_space
grid_height = 500
window_height = grid_height + total_top_space
window = pygame.display.set_mode((window_width, window_height))

columns = 25
rows = 25

box_width = window_width // columns
box_height = grid_height // rows

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
DARK_GRAY = (50, 50, 50)      # Default box color
GRAY = (90, 90, 90)           # Wall color
RED = (200, 0, 0)             # Queued color
GREEN = (0, 200, 0)           # Visited color
BLUE = (0, 0, 200)            # Path color
CYAN = (0, 200, 200)          # Start color
YELLOW = (200, 200, 0)        # Target color
BUTTON_COLOR = (70, 70, 70)
BUTTON_HOVER_COLOR = (100, 100, 100)

class Button:
    def __init__(self, x, y, width, height, text):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = BUTTON_COLOR
        self.is_hovered = False

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect, border_radius=5)
        font = pygame.font.Font(None, 24)
        text_surface = font.render(self.text, True, WHITE)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
            self.color = BUTTON_HOVER_COLOR if self.is_hovered else BUTTON_COLOR

        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1 and self.rect.collidepoint(event.pos):
                return True
        return False

class Box:
    def __init__(self,i,j):
        self.x = i
        self.y = j
        self.start = False
        self.wall = False
        self.target = False
        self.queued = False
        self.visited = False
        self.neighbours = []
        self.prior = None
        # Additional attributes for A* and Dijkstra
        self.g_score = float('inf')
        self.f_score = float('inf')

    def reset_pathfinding(self):
        self.queued = False
        self.visited = False
        self.prior = None
        self.g_score = float('inf')
        self.f_score = float('inf')

    def __lt__(self,other):
        return self.f_score < other.f.score
    
    def draw(self,surface,color):
        pygame.draw.rect(surface, color, (self.x * box_width, self.y * box_height + total_top_space, box_width-2, box_height-2))
    
class PathFinder:
    def __init__(self):
        self.path = []

    def manhattan_distance(self,box1,box2):
        return abs(box1.x - box2.x) + abs(box1.y - box2.y)
    
    def euclidean_distance(self,box1,box2):
        return math.sqrt((box1.x - box2.x)**2 + (box1.y - box2.y)**2)

    def reset(self):
        self.path = []
        for row in grid:
            for box in row:
                box.reset_pathfinding()
        if start_box:
            start_box.visited = True

    def bfs(self, start_box, target_box):
        """Breadth First Search algorithm"""
        self.reset()
        queue = [start_box]
        start_box.g_score = 0

        while queue:
            current = queue.pop(0)
            current.visited = True

            if current == target_box:
                self.reconstruct_path(current)
                return True
            
            for neighbour in current.neighbours:
                if not neighbour.queued and not neighbour.wall:
                    neighbour.queued = True
                    neighbour.prior = current
                    queue.append(neighbour)

            return False

    def dijkstra(self, start_box, target_box):
        """Dijkstra's algorithm"""
        self.reset()
        pq = PriorityQueue()

        start_box.g_score = 0
        start_box.f_score = 0
        pq.put((0, start_box))

        while not pq.empty():
            current = pq.get()[1]
            current.visited = True

            if current == target_box:
                self.reconstruct_path(current)
                return True

            for neighbour in current.neighbours:
                if not neighbour.wall:
                    # Cost is 1 for all edges in this grid
                    tentative_g_score = current.g_score + 1

                    if tentative_g_score < neighbour.g_score:
                        neighbour.prior = current
                        neighbour.g_score = tentative_g_score
                        neighbour.f_score = tentative_g_score
                        neighbour.queued = True
                        pq.put((neighbour.f_score, neighbour))
        return False

    def a_star(self, start_box, target_box):
        """A* algorithm"""
        self.reset()
        pq = PriorityQueue()

        start_box.g_score = 0
        start_box.f_score = self.manhattan_distance(start_box, target_box)
        pq.put((start_box.f_score, start_box))

        while not pq.empty():
            current = pq.get()[1]
            current.visited = True

            if current == target_box:
                self.reconstruct_path(current)
                return True

            for neighbour in current.neighbours:
                if not neighbour.wall:
                    tentative_g_score = current.g_score + 1

                    if tentative_g_score < neighbour.g_score:
                        neighbour.prior = current
                        neighbour.g_score = tentative_g_score
                        neighbour.f_score = tentative_g_score + self.manhattan_distance(neighbour, target_box)
                        neighbour.queued = True
                        pq.put((neighbour.f_score, neighbour))
        return False
    
    
    
    def reconstruct_path(self,current):
        self.path = []
        while current.prior:
            self.path.append(current)
            current = current.prior

    def get_path(self):
        return self.path
    
def create_grid():
    global grid, start_box, target_box
    grid = [[Box(i, j) for j in range(rows)] for i in range(columns)]

    # Set the start box at [0][0]
    start_box = grid[0][0]
    start_box.start = True
    start_box.visited = True

    # Connect the boxes to their neighbours
    for i in range(columns):
        for j in range(rows):
            box = grid[i][j]
            if i > 0:
                box.neighbours.append(grid[i - 1][j])
            if i < columns - 1:
                box.neighbours.append(grid[i + 1][j])
            if j > 0:
                box.neighbours.append(grid[i][j - 1])
            if j < rows - 1:
                box.neighbours.append(grid[i][j + 1])

    target_box = None

def main():
    global start_box, target_box, current_algorithm, target_box_set
    dragging_start = False
    dragging_target = False

    reset_button = Button(10, 10, 80, 30, "Reset")
    search_button = Button(100, 10, 80, 30, "Search")

    algorithms = ['BFS', 'Dijkstra', 'A*']
    algorithm_buttons = []
    button_width = 80
    button_height = 30
    total_width = len(algorithms) * button_width + (len(algorithms) - 1) * button_space
    start_x = (window_width - total_width) // 2

    for i , algo in enumerate(algorithms):
        x = start_x + i * (button_width + button_space)
        algorithm_buttons.append(Button(x,10,button_width , button_height , algo))

    current_algorithm_index = 0
    current_algorithm = algorithms[current_algorithm_index]
    pathfinder = PathFinder()
    target_box_set = False

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            # Handle algorithm selection
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                x, y = pygame.mouse.get_pos()
                for i, button in enumerate(algorithm_buttons):
                    if button.rect.collidepoint(x, y):
                        current_algorithm_index = i
                        current_algorithm = algorithms[current_algorithm_index]
                        pathfinder.reset()

            if reset_button.handle_event(event):
                create_grid()
                target_box_set = False
            
            if search_button.handle_event(event) and target_box_set and start_box:
                if current_algorithm == 'BFS':
                    pathfinder.bfs(start_box, target_box)
                elif current_algorithm == 'Dijkstra':
                    pathfinder.dijkstra(start_box, target_box)
                else:  # A*
                    pathfinder.a_star(start_box, target_box)
                    
                if not pathfinder.path:
                    pathfinder.reset()

            # Check if clicking on start or target box to drag
            elif event.type == pygame.MOUSEBUTTONDOWN:
                x, y = pygame.mouse.get_pos()
                y -= total_top_space
                if 0 <= y < grid_height:
                    i = x // box_width
                    j = y // box_height
                    if 0 <= i < columns and 0 <= j < rows:
                        # Left click
                        if event.button == 1:
                            if grid[i][j] == start_box:
                                dragging_start = True
                            elif grid[i][j] == target_box:
                                dragging_target = True
                        # Right click
                        elif event.button == 3:
                            if target_box_set and target_box:
                                target_box.target = False
                            target_box = grid[i][j]
                            if not target_box.start and not target_box.wall:
                                target_box.target = True
                                target_box_set = True

            elif event.type == pygame.MOUSEBUTTONUP:
                # Drop the start or target box
                if dragging_start:
                    x, y = pygame.mouse.get_pos()
                    y -= total_top_space
                    i = x // box_width 
                    j = y // box_height
                    if 0 <= i < columns and 0 <= j < rows:
                        start_box.start = False
                        start_box.visited = False
                        start_box = grid[i][j]
                        start_box.start = True
                        start_box.visited = True
                    dragging_start = False
                elif dragging_target:
                    x, y = pygame.mouse.get_pos()
                    y -= total_top_space
                    i = x // box_width 
                    j = y // box_height
                    if 0 <= i < columns and 0 <= j < rows:
                        if target_box:
                            target_box.target = False
                        target_box = grid[i][j]
                        target_box.target = True
                    dragging_target = False

            # Mouse Controls
            elif event.type == pygame.MOUSEMOTION:
                x, y = pygame.mouse.get_pos()
                y -= total_top_space  
                # Only process mouse input if it's within the grid area
                if 0 <= y < grid_height:
                    i = x // box_width
                    j = y // box_height
                    # Draw Wall
                    if 0 <= i < columns and 0 <= j < rows:
                        box = grid[i][j]
                        if pygame.mouse.get_pressed()[0] and not dragging_start and not dragging_target and not box.start and not box.target:
                            box.wall = True

        window.fill(BLACK)

        # Draw algorithm buttons
        for i, button in enumerate(algorithm_buttons):
            if i == current_algorithm_index:
                button.color = BUTTON_HOVER_COLOR
            else:
                button.color = BUTTON_COLOR
            button.draw(window)

        reset_button.draw(window)
        search_button.draw(window)
        
        # Draw grid
        for i in range(columns):
            for j in range(rows):
                box = grid[i][j]
                box.draw(window, DARK_GRAY)

                if box.queued:
                    box.draw(window, RED)
                if box.visited:
                    box.draw(window, GREEN)
                if box in pathfinder.path:
                    box.draw(window, BLUE)
                if box == start_box:
                    box.draw(window, CYAN)
                if box.wall:
                    box.draw(window, GRAY)
                if box == target_box:
                    box.draw(window, YELLOW)
        
        pygame.display.flip()

create_grid()
main()