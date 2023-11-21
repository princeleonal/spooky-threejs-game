import { Black, MessageDispatcher } from "black-engine";
import UI from "./ui/ui";
import Scene3D from "./scene/scene3d";
import { BUTTON_TYPE } from "./scene/game-scene/game-field/data/keyboard-config";
import DEBUG_CONFIG from "./core/configs/debug-config";

export default class MainScene {
  constructor(data) {
    this.events = new MessageDispatcher();

    this._data = data;
    this._scene = data.scene;
    this._camera = data.camera;

    this._scene3D = null;
    this._ui = null;

    this._init();
  }

  afterAssetsLoad() {
    Black.stage.addChild(this._ui);
    this._scene.add(this._scene3D);

    this._scene3D.initLevel();

    if (DEBUG_CONFIG.startFromGameplay) {
      this._ui.onStartGame();
    }
  }

  update(dt) {
    if (dt > 0.1) {
      dt = 0.1;
    }

    this._scene3D.update(dt);
    this._ui.update(dt);
  }

  _init() {
    this._scene3D = new Scene3D(this._data);
    this._ui = new UI();

    this._initSignals();
  }

  _initSignals() {
    this._ui.on('onSoundChanged', () => this._scene3D.onSoundChanged());
    this._ui.on('onStartGame', () => this._scene3D.onStartGame());
    this._ui.on('onRestartGame', () => this._scene3D.onRestartGame());
    this._ui.on('onLeft', () => this._scene3D.onButtonPressed(BUTTON_TYPE.Left));
    this._ui.on('onRight', () => this._scene3D.onButtonPressed(BUTTON_TYPE.Right));
    this._ui.on('onUp', () => this._scene3D.onButtonPressed(BUTTON_TYPE.Up));
    this._ui.on('onDown', () => this._scene3D.onButtonPressed(BUTTON_TYPE.Down));
    this._ui.on('onPointerMove', (msg, x, y) => this._scene3D.onPointerMove(x, y));
    this._ui.on('onPointerDown', () => this._scene3D.onPointerDown());
    this._ui.on('onPointerUp', () => this._scene3D.onPointerUp());

    this._scene3D.events.on('fpsMeterChanged', () => this.events.post('fpsMeterChanged'));
    this._scene3D.events.on('onSoundsEnabledChanged', () => this._ui.updateSoundIcon());
    this._scene3D.events.on('gameOver', () => this._ui.onGameOver());
    this._scene3D.events.on('scoreChanged', (msg, score) => this._ui.onScoreChanged(score));
    this._scene3D.events.on('onConsumableCollect', (msg, consumableType, position) => this._ui.onConsumableCollect(consumableType, position));
    this._scene3D.events.on('gameplayStarted', () => this._ui.onGameplayStarted());
    this._scene3D.events.on('onRoundChanged', () => this._ui.onRoundChanged());
    this._scene3D.events.on('onButtonPress', () => this._ui.hideTutorial());
    this._scene3D.events.on('stopBooster', () => this._ui.stopBooster());
    this._scene3D.events.on('startInvulnerabilityBooster', (msg, duration) => this._ui.startInvulnerabilityBooster(duration));
    this._scene3D.events.on('livesChanged', () => this._ui.onLivesChanged());
  }
}
