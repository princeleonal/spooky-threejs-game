import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import SCENE_CONFIG from './configs/scene-config';
import MainScene from '../main-scene';
import LoadingOverlay from './loading-overlay';
import { CanvasDriver, Engine, Input, MasterAudio, StageScaleMode } from 'black-engine';
import Loader from './loader';
import Scene3DDebugMenu from './helpers/gui-helper/scene-3d-debug-menu';
import { GLOBAL_LIGHT_CONFIG } from './configs/global-light-config';
import isMobile from 'ismobilejs';
import DEBUG_CONFIG from './configs/debug-config';
import Materials from './materials';

export default class BaseScene {
  constructor() {
    this._scene = null;
    this._renderer = null;
    this._camera = null;
    this._loadingOverlay = null;
    this._mainScene = null;
    this._scene3DDebugMenu = null;
    this._orbitControls = null;
    this._audioListener = null;

    this._windowSizes = {};
    this._isAssetsLoaded = false;

    SCENE_CONFIG.isMobile = isMobile(window.navigator).any;
    this._isKeyboardShortcutsShown = false;

    this._init();
  }

  createGameScene() {
    new Materials();

    const data = {
      scene: this._scene,
      camera: this._camera,
      renderer: this._renderer,
      orbitControls: this._orbitControls,
      audioListener: this._audioListener,
    };

    this._mainScene = new MainScene(data);

    this._initMainSceneSignals();
  }

  afterAssetsLoaded() {
    this._isAssetsLoaded = true;

    this._loadingOverlay.hide();
    this._scene3DDebugMenu.showAfterAssetsLoad();
    this._mainScene.afterAssetsLoad();
    this._setupBackgroundColor();
  }

  _initMainSceneSignals() {
    this._mainScene.events.on('fpsMeterChanged', () => this._scene3DDebugMenu.onFpsMeterClick());
  }

  _init() {
    this._initBlack();
    this._initThreeJS();
    this._initUpdate();
  }

  _initBlack() {
    const engine = new Engine('container', Loader, CanvasDriver, [Input, MasterAudio]);

    engine.pauseOnBlur = false;
    engine.pauseOnHide = false;
    engine.start();

    engine.stage.setSize(640, 960);
    engine.stage.scaleMode = StageScaleMode.LETTERBOX;
  }

  _initThreeJS() {
    this._initScene();
    this._initRenderer();
    this._initCamera();
    this._initLights();
    this._initFog();
    this._initAxesHelper();
    this._initLoadingOverlay();
    this._initOnResize();
    this._initAudioListener();

    this._initScene3DDebugMenu();
  }

  _initScene() {
    this._scene = new THREE.Scene();
  }

  _initRenderer() {
    this._windowSizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const canvas = document.querySelector('canvas.webgl');

    const renderer = this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: SCENE_CONFIG.antialias,
    });

    renderer.setSize(this._windowSizes.width, this._windowSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE_CONFIG.maxPixelRatio));

    // renderer.outputColorSpace = THREE.SRGBColorSpace;

    // renderer.useLegacyLights = false;
    // renderer.physicallyCorrectLights = true;
    // renderer.outputEncoding = THREE.sRGBEncoding;

    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initCamera() {
    const camera = this._camera = new THREE.PerspectiveCamera(SCENE_CONFIG.fov.desktop, this._windowSizes.width / this._windowSizes.height, 0.5, 40);
    this._scene.add(camera);

    if (SCENE_CONFIG.isMobile) {
      this._camera.fov = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fov.mobile.portrait : SCENE_CONFIG.fov.mobile.landscape;
      this._camera.updateProjectionMatrix();
    }
  }

  _initLights() {
    if (GLOBAL_LIGHT_CONFIG.ambient.enabled) {
      const ambientLight = new THREE.AmbientLight(GLOBAL_LIGHT_CONFIG.ambient.color, GLOBAL_LIGHT_CONFIG.ambient.intensity);
      this._scene.add(ambientLight);
    }

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(-3, 5, 5);
    this._scene.add(directionalLight);

    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 15;

    directionalLight.shadow.camera.left = -9;
    directionalLight.shadow.camera.right = 8;
    directionalLight.shadow.camera.top = 7.5;
    directionalLight.shadow.camera.bottom = -5.5;

    // directionalLight.shadow.bias = 0.0001;

    // const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this._scene.add(directionalLightCameraHelper);
  }

  _initFog() {
    if (SCENE_CONFIG.fog.enabled) {
      let near = SCENE_CONFIG.fog.desktop.near;
      let far = SCENE_CONFIG.fog.desktop.far;

      if (SCENE_CONFIG.isMobile) {
        near = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fog.mobile.portrait.near : SCENE_CONFIG.fog.mobile.landscape.near;
        far = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fog.mobile.portrait.far : SCENE_CONFIG.fog.mobile.landscape.far;
      }

      this._scene.fog = new THREE.Fog(SCENE_CONFIG.backgroundColor, near, far);
    }
  }

  _initAxesHelper() {
    if (DEBUG_CONFIG.axesHelper) {
      const axesHelper = new THREE.AxesHelper(5);
      this._scene.add(axesHelper);
    }
  }

  _initLoadingOverlay() {
    const loadingOverlay = this._loadingOverlay = new LoadingOverlay();
    this._scene.add(loadingOverlay);
  }

  _initOnResize() {
    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    this._windowSizes.width = window.innerWidth;
    this._windowSizes.height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, SCENE_CONFIG.maxPixelRatio);

    this._camera.aspect = this._windowSizes.width / this._windowSizes.height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(this._windowSizes.width, this._windowSizes.height);
    this._renderer.setPixelRatio(pixelRatio);

    if (SCENE_CONFIG.isMobile) {
      this._camera.fov = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fov.mobile.portrait : SCENE_CONFIG.fov.mobile.landscape;
      this._camera.updateProjectionMatrix();

      if (SCENE_CONFIG.fog.enabled) {
        this._scene.fog.near = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fog.mobile.portrait.near : SCENE_CONFIG.fog.mobile.landscape.near;
        this._scene.fog.far = this._windowSizes.width < this._windowSizes.height ? SCENE_CONFIG.fog.mobile.portrait.far : SCENE_CONFIG.fog.mobile.landscape.far;
      }
    }
  }

  _setupBackgroundColor() {
    this._scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);

    // const texture = Loader.assets['environment'];
    // const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
    // renderTarget.fromEquirectangularTexture(this._renderer, texture);
    // this._scene.background = renderTarget.texture;
  }

  _initAudioListener() {
    const audioListener = this._audioListener = new THREE.AudioListener();
    this._camera.add(audioListener);
  }

  _initScene3DDebugMenu() {
    this._scene3DDebugMenu = new Scene3DDebugMenu(this._scene, this._camera, this._renderer);
    this._orbitControls = this._scene3DDebugMenu.getOrbitControls();
  }

  _initUpdate() {
    const clock = new THREE.Clock(true);

    const update = () => {
      this._scene3DDebugMenu.preUpdate();

      const deltaTime = clock.getDelta();

      if (this._isAssetsLoaded) {
        TWEEN.update();
        this._scene3DDebugMenu.update();

        if (this._mainScene) {
          this._mainScene.update(deltaTime);
        }

        this._renderer.render(this._scene, this._camera);
      }

      this._scene3DDebugMenu.postUpdate();
      window.requestAnimationFrame(update);
    }

    update();
  }
}
