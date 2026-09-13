/**
 * Brinewake — entry point.
 *
 * Boots the render system, builds the world and hands control to the game.
 */

import { Game } from './core/game';

const container = document.getElementById('game');
if (!container) throw new Error('missing #game container');

const game = new Game(container, document.getElementById('ui') as HTMLElement);
game.start();

// Exposed for the debug console and for automated visual checks.
(window as unknown as { brinewake: Game }).brinewake = game;
