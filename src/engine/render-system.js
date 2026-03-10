/**
 * Encapsulates canvas rendering entry points for the main game loop.
 */
export class RenderSystem {
    /**
     * @param {import('./game.js').Game} game
     */
    constructor(game) {
        this.game = game;
    }

    beginFrame() {
        this.game.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        this.game.world.draw(this.game.ctx, this.game.canvas, this.game.currentScreenX, this.game.currentScreenY);
    }

    renderPlayer() {
        this.game.player.draw(this.game.ctx);
    }
}
