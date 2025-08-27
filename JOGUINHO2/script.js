document.addEventListener('DOMContentLoaded', () => {
    class Game {
        constructor() {
            // --- Elementos do DOM ---
            this.loginForm = document.getElementById('login-form');
            this.loginScreen = document.getElementById('login-screen');
            this.gameScreen = document.getElementById('game-screen');
            this.playerNameInput = document.getElementById('player-name');
            this.playerEmailInput = document.getElementById('player-email');
            this.playerPhoneInput = document.getElementById('player-phone');
            this.playerDisplay = document.getElementById('player-display');
            this.gridBackground = document.getElementById('grid-background');
            this.gridTiles = document.getElementById('grid-tiles');
            this.scoreDisplay = document.getElementById('score');
            this.newGameButton = document.getElementById('new-game-button');
            this.gameContainer = document.querySelector('.game-container');

            // --- Estado do Jogo ---
            this.gridSize = 4;
            this.grid = [];
            this.score = 0;
            this.isMoving = false;
            this.playerName = '';
            
            // Variáveis para controle de touch
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;

            this.setupEventListeners();
        }

        setupEventListeners() {
            this.loginForm.addEventListener('submit', this.startGame.bind(this));
            this.newGameButton.addEventListener('click', this.initGame.bind(this));
            document.addEventListener('keyup', this.handleInput.bind(this));
            
            // Adicionar suporte para WASD
            document.addEventListener('keyup', (e) => {
                const keyMap = {
                    "w": "ArrowUp",
                    "a": "ArrowLeft",
                    "s": "ArrowDown",
                    "d": "ArrowRight"
                };
                
                if (keyMap[e.key]) {
                    const event = new KeyboardEvent('keyup', { key: keyMap[e.key] });
                    this.handleInput(event);
                }
            });
            
            // Adicionar event listeners para touch
            this.gameContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.gameContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.gameContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        }
        
        // Métodos para manipulação de touch
        handleTouchStart(event) {
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
            event.preventDefault();
        }
        
        handleTouchMove(event) {
            // Permite rolagem da página se o movimento for principalmente vertical
            if (Math.abs(event.touches[0].clientY - this.touchStartY) > 50) {
                return;
            }
            event.preventDefault();
        }
        
        handleTouchEnd(event) {
            this.touchEndX = event.changedTouches[0].clientX;
            this.touchEndY = event.changedTouches[0].clientY;
            this.handleSwipe();
            event.preventDefault();
        }
        
        handleSwipe() {
            const dx = this.touchEndX - this.touchStartX;
            const dy = this.touchEndY - this.touchStartY;
            
            // Determina a direção baseada no maior movimento
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) { // Sensibilidade mínima
                    if (dx > 0) {
                        this.handleInput({ key: 'ArrowRight' });
                    } else {
                        this.handleInput({ key: 'ArrowLeft' });
                    }
                }
            } else {
                if (Math.abs(dy) > 30) { // Sensibilidade mínima
                    if (dy > 0) {
                        this.handleInput({ key: 'ArrowDown' });
                    } else {
                        this.handleInput({ key: 'ArrowUp' });
                    }
                }
            }
        }

        startGame(e) {
            e.preventDefault();
            this.playerName = this.playerNameInput.value.trim();
            const playerEmail = this.playerEmailInput.value.trim();
            const playerPhone = this.playerPhoneInput.value.trim();
            
            if (this.playerName === '') {
                alert('Por favor, informe seu nome');
                return;
            }
            
            this.playerDisplay.textContent = `Olá, ${this.playerName}!`;
            this.loginScreen.style.display = 'none';
            this.gameScreen.style.display = 'block';
            this.initGame();
        }

        initGame() {
            this.score = 0;
            this.updateScore(0);
            this.isMoving = false;
            this.setupGrid();
            this.addNewTile();
            this.addNewTile();
            
            // Remover mensagem de game over se existir
            const gameOverMessage = document.querySelector('.game-over');
            if (gameOverMessage) {
                gameOverMessage.remove();
            }
        }

        setupGrid() {
            this.gridBackground.innerHTML = '';
            this.gridTiles.innerHTML = '';
            this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));

            for (let i = 0; i < this.gridSize * this.gridSize; i++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                this.gridBackground.appendChild(cell);
            }
        }

        addNewTile() {
            const emptyCells = [];
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (!this.grid[y][x]) {
                        emptyCells.push({ x, y });
                    }
                }
            }

            if (emptyCells.length === 0) return;

            const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            const tile = new Tile(value, x, y);
            this.grid[y][x] = tile;
        }

        updateScore(points) {
            this.score += points;
            this.scoreDisplay.textContent = this.score;
        }

        async handleInput(e) {
            // Ignorar se estiver digitando em um input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }
            
            if (this.isMoving) return;

            const keyMap = {
                "ArrowUp": { x: 0, y: -1 },
                "ArrowDown": { x: 0, y: 1 },
                "ArrowLeft": { x: -1, y: 0 },
                "ArrowRight": { x: 1, y: 0 },
                "w": { x: 0, y: -1 },
                "s": { x: 0, y: 1 },
                "a": { x: -1, y: 0 },
                "d": { x: 1, y: 0 }
            };

            const vector = keyMap[e.key];
            if (!vector) return;

            this.isMoving = true;
            
            const moved = this.move(vector);

            // Animação leva 100ms (ver CSS), esperamos um pouco mais
            await new Promise(resolve => setTimeout(resolve, 120));

            if (moved) {
                this.addNewTile();
            }
            
            if (!this.canMove()) {
                setTimeout(() => this.showGameOver(), 200);
            }

            this.isMoving = false;
        }

        move(vector) {
            let moved = false;
            let scoreToAdd = 0;

            const traversals = this.buildTraversals(vector);
            
            // Primeira passada: mover todos os blocos
            traversals.y.forEach(y => {
                traversals.x.forEach(x => {
                    const currentTile = this.grid[y][x];
                    if (!currentTile) return;

                    let furthestPosition = { x, y };
                    let nextPosition = { x: x + vector.x, y: y + vector.y };
                    
                    // Encontra a posição mais distante que o bloco pode ir
                    while (this.isWithinBounds(nextPosition) && !this.grid[nextPosition.y][nextPosition.x]) {
                        furthestPosition = nextPosition;
                        nextPosition = { x: nextPosition.x + vector.x, y: nextPosition.y + vector.y };
                    }
                    
                    const movedTile = this.grid[y][x];
                    
                    // Move o bloco se a posição mudou
                    if (furthestPosition.x !== x || furthestPosition.y !== y) {
                        this.grid[furthestPosition.y][furthestPosition.x] = movedTile;
                        this.grid[y][x] = null;
                        movedTile.updatePosition(furthestPosition.x, furthestPosition.y);
                        moved = true;
                    }
                });
            });
            
            // Segunda passada: verificar fusões
            traversals.y.forEach(y => {
                traversals.x.forEach(x => {
                    const currentTile = this.grid[y][x];
                    if (!currentTile) return;
                    
                    const nextPosition = { x: x + vector.x, y: y + vector.y };
                    
                    if (!this.isWithinBounds(nextPosition)) return;
                    
                    const adjacentTile = this.grid[nextPosition.y][nextPosition.x];
                    
                    // Verifica se pode fundir com o bloco adjacente
                    if (adjacentTile && adjacentTile.value === currentTile.value && !adjacentTile.mergedThisTurn && !currentTile.mergedThisTurn) {
                        // Remove ambos os tiles
                        this.grid[y][x] = null;
                        this.grid[nextPosition.y][nextPosition.x] = null;
                        
                        // Cria novo tile com valor combinado
                        const newValue = currentTile.value * 2;
                        scoreToAdd += newValue;
                        const newTile = new Tile(newValue, nextPosition.x, nextPosition.y);
                        newTile.mergedThisTurn = true;
                        this.grid[nextPosition.y][nextPosition.x] = newTile;
                        
                        // Remove os tiles antigos
                        currentTile.destroy();
                        adjacentTile.destroy();
                        
                        moved = true;
                    }
                });
            });
            
            // Terceira passada: mover blocos novamente após fusões (para preencher espaços vazios)
            traversals.y.forEach(y => {
                traversals.x.forEach(x => {
                    const currentTile = this.grid[y][x];
                    if (!currentTile) return;

                    let furthestPosition = { x, y };
                    let nextPosition = { x: x + vector.x, y: y + vector.y };
                    
                    // Encontra a posição mais distante que o bloco pode ir
                    while (this.isWithinBounds(nextPosition) && !this.grid[nextPosition.y][nextPosition.x]) {
                        furthestPosition = nextPosition;
                        nextPosition = { x: nextPosition.x + vector.x, y: nextPosition.y + vector.y };
                    }
                    
                    const movedTile = this.grid[y][x];
                    
                    // Move o bloco se a posição mudou
                    if (furthestPosition.x !== x || furthestPosition.y !== y) {
                        this.grid[furthestPosition.y][furthestPosition.x] = movedTile;
                        this.grid[y][x] = null;
                        movedTile.updatePosition(furthestPosition.x, furthestPosition.y);
                        moved = true;
                    }
                });
            });
            
            this.updateScore(scoreToAdd);
            this.clearMergedFlags();
            return moved;
        }

        buildTraversals(vector) {
            const traversals = { x: [], y: [] };
            for (let i = 0; i < this.gridSize; i++) {
                traversals.x.push(i);
                traversals.y.push(i);
            }
            if (vector.x === 1) traversals.x.reverse();
            if (vector.y === 1) traversals.y.reverse();
            return traversals;
        }

        isWithinBounds({ x, y }) {
            return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
        }

        clearMergedFlags() {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (this.grid[y][x]) {
                        this.grid[y][x].mergedThisTurn = false;
                    }
                }
            }
        }
        
        canMove() {
            // Verifica se há espaços vazios
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (!this.grid[y][x]) return true;
                    
                    const currentValue = this.grid[y][x].value;
                    // Checar vizinhos
                    if (x < this.gridSize - 1) {
                        const right = this.grid[y][x+1];
                        if (right && right.value === currentValue) return true;
                    }
                    if (y < this.gridSize - 1) {
                        const down = this.grid[y+1][x];
                        if (down && down.value === currentValue) return true;
                    }
                }
            }
            return false;
        }
        
        showGameOver() {
            const gameOverDiv = document.createElement('div');
            gameOverDiv.className = 'game-over';
            gameOverDiv.innerHTML = `
                <h2>Fim de Jogo!</h2>
                <p>Pontuação: ${this.score}</p>
                <button onclick="document.querySelector('.game-over').remove(); game.initGame();">Jogar Novamente</button>
            `;
            this.gameScreen.querySelector('.game-container').appendChild(gameOverDiv);
        }
    }

    class Tile {
        constructor(value, x, y) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.mergedThisTurn = false;
            
            this.element = this.createElement();
            this.updatePosition(x, y, true);
        }

        createElement() {
            const tileElement = document.createElement('div');
            tileElement.classList.add('tile');
            tileElement.dataset.value = this.value;
            tileElement.textContent = this.value;
            document.getElementById('grid-tiles').appendChild(tileElement);
            return tileElement;
        }

        updatePosition(x, y, isNew = false) {
            this.x = x;
            this.y = y;
            const positionX = x * (100 + 15) + 15;
            const positionY = y * (100 + 15) + 15;
            this.element.style.transform = `translate(${positionX}px, ${positionY}px)`;
            
            this.element.dataset.value = this.value;
            this.element.textContent = this.value;

            if (isNew) {
                this.element.classList.add('new');
                this.element.addEventListener('animationend', () => {
                    this.element.classList.remove('new');
                }, { once: true });
            }
        }
        
        updateValue(newValue) {
            this.value = newValue;
            this.element.textContent = newValue;
            this.element.dataset.value = newValue;
            this.element.classList.add('merged');
            this.element.addEventListener('animationend', () => {
                this.element.classList.remove('merged');
            }, { once: true });
        }

        destroy() {
            this.element.remove();
        }
    }

    window.game = new Game();
});