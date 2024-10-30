from tkinter import messagebox, Tk
import pygame
import sys

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
GRAY = (90, 90, 90)
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
    def __init__(self, i, j):
        self.x = i
        self.y = j
        self.start = False
        self.wall = False
        self.target = False
        self.queued = False
        self.visited = False
        self.neighbours = []
        self.prior = None

    def draw(self, win, color):
        pygame.draw.rect(win, color, (self.x * box_width, self.y * box_height + total_top_space, box_width - 2, box_height - 2))

    def set_neighbours(self):
        if self.x > 0:
            self.neighbours.append(grid[self.x - 1][self.y])
        if self.x < columns - 1:
            self.neighbours.append(grid[self.x + 1][self.y])
        if self.y > 0:
            self.neighbours.append(grid[self.x][self.y - 1])
        if self.y < rows - 1:
            self.neighbours.append(grid[self.x][self.y + 1])

grid = []
queue = []
path = []

# Create Grid
def create_grid():
    global grid,queue,path,start_box
    grid = []
    queue = []
    path = []

    for i in range(columns):
        arr = []
        for j in range(rows):
            arr.append(Box(i, j))
        grid.append(arr)

    # Set Neighbours
    for i in range(columns):
        for j in range(rows):
            grid[i][j].set_neighbours()

    start_box = grid[0][0]
    start_box.start = True
    start_box.visited = True
    queue.append(start_box)

create_grid()

font_path = 'crackman/Crackman Back.otf'
font = pygame.font.Font(None, 36)

text_surface = font.render('PathFinder Visualization Algorithm', True, WHITE)
text_rect = text_surface.get_rect(center=(window_width // 2, header_height // 2))

# Create reset button
button_width = 100
button_height = 30

reset_button_x = (window_width - (2 * button_width + button_space)) // 2
button_y = (header_height + button_height) // 2
search_button_x = reset_button_x + button_width + button_space

reset_button = Button(reset_button_x,button_y,button_width,button_height,'Reset')
search_button = Button(search_button_x,button_y,button_width,button_height,'Start Search')

dragging_start = False

def main():
    global start_box,dragging_start,target_box

    begin_search = False
    target_box_set = False
    searching = True
    target_box = None

    while True:
        for event in pygame.event.get():
            # Quit Window
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            # Handle reset button
            if reset_button.handle_event(event):
                create_grid()
                begin_search = False
                target_box_set = False
                searching = True
                target_box = None

            # Start Algorithm
            if search_button.handle_event(event) and target_box_set:
                begin_search = True


            # Check if clicking on start box to drag
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
                        elif event.button == 3:
                            if target_box_set and target_box:
                                target_box.target = False
                            target_box = grid[i][j]
                            if not target_box.start and not target_box.wall:
                                target_box.target = True
                                target_box_set = True


            elif event.type == pygame.MOUSEBUTTONUP:
                # Drop the start box
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
                        queue.clear()
                        queue.append(start_box)
                    dragging_start = False

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
                        if pygame.mouse.get_pressed()[0] and not dragging_start and not box.start:
                            box.wall = True

        if begin_search:
            if len(queue) > 0 and searching:
                current_box = queue.pop(0)
                current_box.visited = True
                if current_box == target_box:
                    searching = False
                    while current_box.prior != start_box:
                        path.append(current_box.prior)
                        current_box = current_box.prior
                else:
                    for neighbour in current_box.neighbours:
                        if not neighbour.queued and not neighbour.wall:
                            neighbour.queued = True
                            neighbour.prior = current_box
                            queue.append(neighbour)
            else:
                if searching:
                    Tk().wm_withdraw()
                    messagebox.showinfo('No solution', 'There is no solution')
                    searching = False

        window.fill(BLACK)

        # Display the heading 
        window.blit(text_surface, text_rect)

        # Draw reset button
        reset_button.draw(window)
        search_button.draw(window)

        #Draw grid
        for i in range(columns):
            for j in range(rows):
                box = grid[i][j]
                box.draw(window, DARK_GRAY)

                if box.queued:
                    box.draw(window, RED)
                if box.visited:
                    box.draw(window, GREEN)
                if box in path:
                    box.draw(window, BLUE)
                if box.start:
                    box.draw(window, CYAN)
                if box.wall:
                    box.draw(window, GRAY)
                if box.target:
                    box.draw(window, YELLOW)
        pygame.display.flip()


main()
