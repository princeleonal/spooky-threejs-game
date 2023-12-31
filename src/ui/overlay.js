import { Black, DisplayObject, Sprite } from "black-engine";

export default class Overlay extends DisplayObject {
  constructor() {
    super();

    this._view = null;

    this.touchable = true;
  }

  onAdded() {
    this._initView();
    this._initSignals();

    Black.stage.on('resize', () => this._onResize());
    this._onResize();
  }

  _initView() {
    const view = this._view = new Sprite('overlay');
    this.add(view);

    view.alpha = 0;
    view.touchable = true;
  }

  _initSignals() {
    this._view.on('pointerMove', (msg, pointer) => {
      this.post('onPointerMove', pointer.x, pointer.y);
    });

    this._view.on('pointerDown', () => {
      this.post('onPointerDown');
      if (Black.engine.containerElement.style.cursor === 'grab') {
        Black.engine.containerElement.style.cursor = 'grabbing';
      }
    });

    this._view.on('pointerUp', () => {
      this.post('onPointerUp');
      if (Black.engine.containerElement.style.cursor === 'grabbing') {
        Black.engine.containerElement.style.cursor = 'grab';
      }
    });
  }

  _onResize() {
    const bounds = Black.stage.bounds;

    this._view.x = bounds.left;
    this._view.y = bounds.top;

    const overlaySize = 10;
    this._view.scaleX = bounds.width / overlaySize;
    this._view.scaleY = bounds.height / overlaySize;
  }
}
