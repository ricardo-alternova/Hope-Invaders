import type Phaser from 'phaser';

/** Normalized keys we care about — matched from KeyboardEvent.code/key. */
export type GameKey =
  | 'Enter'
  | 'Space'
  | 'Escape'
  | 'KeyP'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'KeyW'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'Digit0';

type Handler = () => void;

export function normalizeKey(event: Pick<KeyboardEvent, 'code' | 'key'>): GameKey | null {
  switch (event.code) {
    case 'Enter':
    case 'NumpadEnter':
      return 'Enter';
    case 'Space':
      return 'Space';
    case 'Escape':
      return 'Escape';
    case 'KeyP':
      return 'KeyP';
    case 'ArrowUp':
      return 'ArrowUp';
    case 'ArrowDown':
      return 'ArrowDown';
    case 'ArrowLeft':
      return 'ArrowLeft';
    case 'ArrowRight':
      return 'ArrowRight';
    case 'KeyW':
      return 'KeyW';
    case 'KeyA':
      return 'KeyA';
    case 'KeyS':
      return 'KeyS';
    case 'KeyD':
      return 'KeyD';
    case 'Digit0':
    case 'Numpad0':
      return 'Digit0';
    default:
      break;
  }

  if (event.key === 'Enter') return 'Enter';
  if (event.key === ' ') return 'Space';
  if (event.key === 'Escape') return 'Escape';
  if (event.key === 'p' || event.key === 'P') return 'KeyP';
  if (event.key === '0') return 'Digit0';
  return null;
}

class GlobalKeyboard {
  private downHandlers = new Map<GameKey, Set<Handler>>();
  private upHandlers = new Map<GameKey, Set<Handler>>();
  private pressed = new Set<GameKey>();
  private listening = false;
  private canvas: HTMLCanvasElement | null = null;
  private textCapture = false;

  constructor() {
    if (typeof document !== 'undefined') {
      this.attachDocumentListeners();
    }
  }

  /** While true, keys are left for name entry instead of game binds. */
  setTextCapture(on: boolean): void {
    this.textCapture = on;
    if (on) this.pressed.clear();
  }

  isDown(key: GameKey): boolean {
    return this.pressed.has(key);
  }

  /** Bind canvas focus helpers once Phaser has created the canvas. */
  install(game: Phaser.Game): void {
    if (typeof document !== 'undefined') {
      this.attachDocumentListeners();
    }
    const bindCanvas = () => {
      const canvas = game.canvas;
      if (!canvas) return;
      this.canvas = canvas;
      canvas.setAttribute('tabindex', '0');
      canvas.style.outline = 'none';

      const focusGame = () => canvas.focus({ preventScroll: true });
      canvas.addEventListener('pointerdown', focusGame);
      canvas.addEventListener('mousedown', focusGame);

      const container = document.getElementById('game-container');
      if (container) {
        container.setAttribute('tabindex', '0');
        container.style.outline = 'none';
        container.addEventListener('pointerdown', focusGame);
      }
    };

    if (game.canvas) {
      bindCanvas();
      return;
    }
    game.events.once('ready', bindCanvas);
  }

  private attachDocumentListeners(): void {
    if (this.listening) return;
    this.listening = true;

    document.addEventListener(
      'keydown',
      (event) => {
        if (this.textCapture) return;
        const key = normalizeKey(event);
        if (!key) return;
        this.pressed.add(key);
        const handlers = this.downHandlers.get(key);
        if (!handlers?.size) return;
        event.preventDefault();
        this.canvas?.focus({ preventScroll: true });
        handlers.forEach((handler) => handler());
      },
      true,
    );

    document.addEventListener(
      'keyup',
      (event) => {
        if (this.textCapture) return;
        const key = normalizeKey(event);
        if (!key) return;
        this.pressed.delete(key);
        const handlers = this.upHandlers.get(key);
        if (!handlers?.size) return;
        event.preventDefault();
        handlers.forEach((handler) => handler());
      },
      true,
    );

    const releaseAll = () => {
      for (const key of [...this.pressed]) {
        this.pressed.delete(key);
        this.upHandlers.get(key)?.forEach((handler) => handler());
      }
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseAll();
    });
  }

  onKeyDown(key: GameKey, handler: Handler): () => void {
    if (!this.downHandlers.has(key)) {
      this.downHandlers.set(key, new Set());
    }
    this.downHandlers.get(key)!.add(handler);
    return () => this.downHandlers.get(key)?.delete(handler);
  }

  onKeyUp(key: GameKey, handler: Handler): () => void {
    if (!this.upHandlers.has(key)) {
      this.upHandlers.set(key, new Set());
    }
    this.upHandlers.get(key)!.add(handler);
    return () => this.upHandlers.get(key)?.delete(handler);
  }
}

export const globalKeyboard = new GlobalKeyboard();

export function bindSceneKeys(bindings: Array<() => void>): () => void {
  return () => bindings.forEach((unbind) => unbind());
}

export function focusGameCanvas(): void {
  document.querySelector<HTMLCanvasElement>('#game-container canvas')?.focus({ preventScroll: true });
}
