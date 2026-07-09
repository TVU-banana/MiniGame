import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AxisDirection, BlockData, LevelDimensions } from '../core/BlockModel';

interface SceneCallbacks {
  onBlockSelect: (blockId: string) => void;
  onPointerActivity: () => void;
}

type FaceName = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

interface BlockVisual {
  group: THREE.Group;
  body: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  picker: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  edges: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
  decals: THREE.Object3D[];
  block: BlockData;
}

interface AnimationEntry {
  blockId: string;
  startTime: number;
  duration: number;
  removable: boolean;
  origin: THREE.Vector3;
  offset: THREE.Vector3;
  resolve: () => void;
}

interface BurstFragment {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  bornAt: number;
  duration: number;
}

interface PickDebugHit {
  name: string;
  uuid: string;
  blockId: string | null;
  distance: number;
}

interface PickDebugInfo {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  canvasPixelX: number;
  canvasPixelY: number;
  ndcX: number;
  ndcY: number;
  hitObjects: PickDebugHit[];
  selectedBlockId: string | null;
  activeBlockCount: number;
  clickableObjectCount: number;
  failureReason: string | null;
}

declare global {
  interface Window {
    __DEBUG_PICKING__?: boolean;
    enablePickingDebug?: () => void;
    disablePickingDebug?: () => void;
  }
}

const FACE_NAMES: FaceName[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
const CELL_SIZE = 1;
const DECAL_EPSILON = 0.01;
const PICK_PADDING = 0.04;
const DEBUG_PICKING_KEY = 'slider-clear-3d:debug-picking';
const FACE_AXIS: Record<FaceName, 'X' | 'Y' | 'Z'> = {
  '+X': 'X',
  '-X': 'X',
  '+Y': 'Y',
  '-Y': 'Y',
  '+Z': 'Z',
  '-Z': 'Z',
};

const WORLD_DIRECTION: Record<AxisDirection, THREE.Vector3> = {
  '+X': new THREE.Vector3(1, 0, 0),
  '-X': new THREE.Vector3(-1, 0, 0),
  '+Y': new THREE.Vector3(0, 1, 0),
  '-Y': new THREE.Vector3(0, -1, 0),
  '+Z': new THREE.Vector3(0, 0, 1),
  '-Z': new THREE.Vector3(0, 0, -1),
};

function isDebugPickingEnabled(): boolean {
  const search = new URLSearchParams(window.location.search);
  return (
    search.get('debugPicking') === '1' ||
    window.__DEBUG_PICKING__ === true ||
    window.localStorage.getItem(DEBUG_PICKING_KEY) === '1'
  );
}

function installDebugPickingHelpers(): void {
  if (!window.enablePickingDebug) {
    window.enablePickingDebug = () => {
      window.__DEBUG_PICKING__ = true;
      window.localStorage.setItem(DEBUG_PICKING_KEY, '1');
      console.info('[DEBUG_PICKING] enabled');
    };
  }

  if (!window.disablePickingDebug) {
    window.disablePickingDebug = () => {
      window.__DEBUG_PICKING__ = false;
      window.localStorage.removeItem(DEBUG_PICKING_KEY);
      console.info('[DEBUG_PICKING] disabled');
    };
  }
}

export class GameScene {
  private readonly renderer: THREE.WebGLRenderer;

  private readonly scene = new THREE.Scene();

  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  private readonly controls: OrbitControls;

  private readonly raycaster = new THREE.Raycaster();

  private readonly pointer = new THREE.Vector2();

  private readonly stageGroup = new THREE.Group();

  private readonly floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }),
  );

  private readonly blockVisuals = new Map<string, BlockVisual>();

  private readonly animations = new Map<string, AnimationEntry>();

  private readonly burstFragments: BurstFragment[] = [];

  private readonly resizeObserver: ResizeObserver;

  private dimensions: LevelDimensions | null = null;

  private pointerDown = { x: 0, y: 0, time: 0 };

  private manualNow: number | null = null;

  private dirty = true;

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: SceneCallbacks,
  ) {
    installDebugPickingHelpers();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight);
    this.host.append(this.renderer.domElement);

    this.camera.position.set(7.6, 7.2, 8.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minPolarAngle = 0.02;
    this.controls.maxPolarAngle = Math.PI - 0.02;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 18;
    this.controls.rotateSpeed = 0.88;
    this.controls.zoomSpeed = 0.94;
    this.controls.target.set(0, 0.8, 0);
    this.controls.addEventListener('change', this.handleControlsChange);

    this.scene.add(this.stageGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(9, 12, 8);
    const fill = new THREE.DirectionalLight(0xffe7e0, 0.65);
    fill.position.set(-6, 5, -5);

    this.scene.add(ambient, key, fill);

    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -3.6;
    this.scene.add(this.floor);

    this.renderer.domElement.classList.add('game-canvas');
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.controls.removeEventListener('change', this.handleControlsChange);
    this.controls.dispose();
    this.renderer.dispose();
  }

  loadLevel(blocks: BlockData[], dimensions: LevelDimensions): void {
    this.clearStage();
    this.dimensions = dimensions;
    this.manualNow = null;
    this.applyRenderQuality(blocks.length);

    for (const block of blocks) {
      const visual = this.createVisual(block);
      this.blockVisuals.set(block.id, visual);
      this.stageGroup.add(visual.group);
    }

    this.syncBlocks(blocks);
    this.fitCamera(dimensions);
    this.invalidate();
  }

  syncBlocks(blocks: BlockData[]): void {
    if (!this.dimensions) {
      return;
    }

    for (const block of blocks) {
      const visual = this.blockVisuals.get(block.id);
      if (!visual) {
        continue;
      }

      const previous = visual.block;
      const directionChanged = previous.direction !== block.direction;
      visual.block = { ...block };
      visual.group.position.copy(this.getWorldPosition(block));
      visual.group.scale.setScalar(1);

      const visible = !block.removed;
      visual.group.visible = visible;
      visual.body.visible = visible;
      visual.picker.visible = visible;
      visual.edges.visible = visible;
      for (const decal of visual.decals) {
        decal.visible = visible;
      }

      this.setGroupOpacity(visual.group, 1);
      if (directionChanged) {
        this.rebuildDecals(visual, block.direction);
      }
    }

    this.invalidate();
  }

  async animateBlock(
    blockId: string,
    removable: boolean,
    direction: { x: number; y: number; z: number },
    distance: number,
  ): Promise<void> {
    const visual = this.blockVisuals.get(blockId);
    if (!visual || this.animations.has(blockId)) {
      return;
    }

    const offset = new THREE.Vector3(direction.x, direction.y, direction.z).multiplyScalar(
      distance * CELL_SIZE,
    );

    await new Promise<void>((resolve) => {
      this.animations.set(blockId, {
        blockId,
        startTime: this.getNow(),
        duration: removable ? 320 : 180,
        removable,
        origin: visual.group.position.clone(),
        offset,
        resolve,
      });
      this.invalidate();
    });
  }

  async animateCheatRemove(blockId: string): Promise<void> {
    const visual = this.blockVisuals.get(blockId);
    if (!visual || visual.block.removed) {
      return;
    }

    this.createShatterBurst(visual);

    await new Promise<void>((resolve) => {
      this.animations.set(blockId, {
        blockId,
        startTime: this.getNow(),
        duration: 260,
        removable: true,
        origin: visual.group.position.clone(),
        offset: new THREE.Vector3(0, 0.36, 0),
        resolve,
      });
      this.invalidate();
    });
  }

  render(): void {
    const now = this.getNow();
    const hasActiveMotion = this.animations.size > 0 || this.burstFragments.length > 0;

    if (this.animations.size > 0) {
      this.updateAnimations(now);
    }
    if (this.burstFragments.length > 0) {
      this.updateBurstFragments(now);
    }
    if (!this.dirty && !hasActiveMotion) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  advanceTime(ms: number): void {
    const base = this.manualNow ?? this.getNow();
    this.manualNow = base + ms;
    this.invalidate();
    this.render();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.invalidate();
  }

  private applyRenderQuality(blockCount: number): void {
    const deviceRatio = window.devicePixelRatio || 1;
    const ratioCap = blockCount >= 120 ? 1 : blockCount >= 80 ? 1.25 : blockCount >= 48 ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(deviceRatio, ratioCap));
    this.invalidate();
  }

  private fitCamera(dimensions: LevelDimensions): void {
    const major = Math.max(dimensions.sizeX, dimensions.sizeY, dimensions.sizeZ);
    const vertical = dimensions.sizeY * 0.2;
    const distance = major * 1.85 + 3.4;
    this.camera.position.set(distance * 0.86, distance * 0.72 + vertical, distance * 0.92);
    this.controls.target.set(0, 0.3 + dimensions.sizeY * 0.1, 0);
    this.controls.minDistance = major * 0.9 + 2.4;
    this.controls.maxDistance = major * 3 + 7;
    this.controls.update();
    this.floor.position.y = -dimensions.sizeY * 0.55 - 0.72;
    this.floor.scale.setScalar(Math.max(dimensions.sizeX, dimensions.sizeZ) * 0.9 + 1.8);
    this.invalidate();
  }

  private clearStage(): void {
    for (const fragment of this.burstFragments) {
      fragment.mesh.geometry.dispose();
      fragment.mesh.material.dispose();
      this.scene.remove(fragment.mesh);
    }
    this.burstFragments.length = 0;

    for (const visual of this.blockVisuals.values()) {
      visual.group.traverse((node: THREE.Object3D) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            material.dispose();
          }
        }
        if (node instanceof THREE.LineSegments) {
          node.geometry.dispose();
          node.material.dispose();
        }
      });
      this.stageGroup.remove(visual.group);
    }

    this.blockVisuals.clear();
    this.animations.clear();
    this.invalidate();
  }

  private createVisual(block: BlockData): BlockVisual {
    const picker = new THREE.Mesh(
      new THREE.BoxGeometry(
        block.sizeX * CELL_SIZE + PICK_PADDING,
        block.sizeY * CELL_SIZE + PICK_PADDING,
        block.sizeZ * CELL_SIZE + PICK_PADDING,
      ),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        block.sizeX * CELL_SIZE - 0.02,
        block.sizeY * CELL_SIZE - 0.02,
        block.sizeZ * CELL_SIZE - 0.02,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xf8fbff,
        roughness: 0.54,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    );

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: 0x171c23, transparent: true, opacity: 0.42 }),
    );

    const group = new THREE.Group();
    group.name = `block-group:${block.id}`;
    group.userData.blockId = block.id;

    picker.name = `picker:${block.id}`;
    picker.userData.blockId = block.id;
    picker.userData.isPicker = true;

    body.name = `body:${block.id}`;
    body.userData.blockId = block.id;

    edges.name = `edges:${block.id}`;
    edges.userData.blockId = block.id;

    group.add(picker, body, edges);

    const visual: BlockVisual = {
      group,
      body,
      picker,
      edges,
      decals: [],
      block: { ...block },
    };

    this.rebuildDecals(visual, block.direction);
    group.position.copy(this.getWorldPosition(block));
    return visual;
  }

  private rebuildDecals(visual: BlockVisual, direction: AxisDirection): void {
    for (const decal of visual.decals) {
      visual.group.remove(decal);
      decal.traverse((node: THREE.Object3D) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            material.dispose();
          }
        }
      });
    }
    visual.decals = [];

    for (const face of FACE_NAMES) {
      if (!this.isFaceParallelToDirection(face, direction)) {
        continue;
      }
      const decal = this.createDecal(visual.block, face, direction);
      visual.group.add(decal);
      visual.decals.push(decal);
    }
  }

  private isFaceParallelToDirection(face: FaceName, direction: AxisDirection): boolean {
    const directionAxis = direction.charAt(1) as 'X' | 'Y' | 'Z';
    return FACE_AXIS[face] !== directionAxis;
  }

  private createDecal(block: BlockData, face: FaceName, direction: AxisDirection): THREE.Object3D {
    const descriptor = this.getFaceDescriptor(block, face);
    const decal = new THREE.Group();
    decal.name = `decal:${block.id}:${face}`;

    const arrowMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(this.createArrowShape(Math.min(descriptor.width, descriptor.height) * 0.82)),
      new THREE.MeshBasicMaterial({
        color: 0x121821,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    arrowMesh.rotation.z = this.getFaceArrowAngle(face, direction);
    arrowMesh.renderOrder = 3;
    decal.add(arrowMesh);

    const rotation = new THREE.Matrix4().makeBasis(
      descriptor.uAxis.clone().normalize(),
      descriptor.vAxis.clone().normalize(),
      descriptor.normal.clone().normalize(),
    );
    decal.quaternion.setFromRotationMatrix(rotation);
    decal.position.copy(descriptor.normal.clone().multiplyScalar(descriptor.offset));
    decal.renderOrder = 2;
    return decal;
  }

  private createArrowShape(size: number): THREE.Shape {
    const length = Math.max(0.16, size);
    const tailHalf = length * 0.08;
    const headHalf = length * 0.2;
    const neck = -length * 0.06;
    const start = -length * 0.48;
    const tip = length * 0.5;

    const shape = new THREE.Shape();
    shape.moveTo(start, -tailHalf);
    shape.lineTo(neck, -tailHalf);
    shape.lineTo(neck, -headHalf);
    shape.lineTo(tip, 0);
    shape.lineTo(neck, headHalf);
    shape.lineTo(neck, tailHalf);
    shape.lineTo(start, tailHalf);
    shape.lineTo(start + length * 0.09, 0);
    shape.closePath();
    return shape;
  }

  private getFaceDescriptor(block: BlockData, face: FaceName): {
    width: number;
    height: number;
    offset: number;
    normal: THREE.Vector3;
    uAxis: THREE.Vector3;
    vAxis: THREE.Vector3;
  } {
    const halfX = (block.sizeX * CELL_SIZE) / 2;
    const halfY = (block.sizeY * CELL_SIZE) / 2;
    const halfZ = (block.sizeZ * CELL_SIZE) / 2;
    const pad = 0.28;

    switch (face) {
      case '+X':
        return {
          width: Math.max(0.18, block.sizeZ * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeY * CELL_SIZE - pad),
          offset: halfX + DECAL_EPSILON,
          normal: new THREE.Vector3(1, 0, 0),
          uAxis: new THREE.Vector3(0, 0, -1),
          vAxis: new THREE.Vector3(0, 1, 0),
        };
      case '-X':
        return {
          width: Math.max(0.18, block.sizeZ * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeY * CELL_SIZE - pad),
          offset: halfX + DECAL_EPSILON,
          normal: new THREE.Vector3(-1, 0, 0),
          uAxis: new THREE.Vector3(0, 0, 1),
          vAxis: new THREE.Vector3(0, 1, 0),
        };
      case '+Y':
        return {
          width: Math.max(0.18, block.sizeX * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeZ * CELL_SIZE - pad),
          offset: halfY + DECAL_EPSILON,
          normal: new THREE.Vector3(0, 1, 0),
          uAxis: new THREE.Vector3(1, 0, 0),
          vAxis: new THREE.Vector3(0, 0, 1),
        };
      case '-Y':
        return {
          width: Math.max(0.18, block.sizeX * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeZ * CELL_SIZE - pad),
          offset: halfY + DECAL_EPSILON,
          normal: new THREE.Vector3(0, -1, 0),
          uAxis: new THREE.Vector3(1, 0, 0),
          vAxis: new THREE.Vector3(0, 0, -1),
        };
      case '+Z':
        return {
          width: Math.max(0.18, block.sizeX * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeY * CELL_SIZE - pad),
          offset: halfZ + DECAL_EPSILON,
          normal: new THREE.Vector3(0, 0, 1),
          uAxis: new THREE.Vector3(1, 0, 0),
          vAxis: new THREE.Vector3(0, 1, 0),
        };
      case '-Z':
        return {
          width: Math.max(0.18, block.sizeX * CELL_SIZE - pad),
          height: Math.max(0.18, block.sizeY * CELL_SIZE - pad),
          offset: halfZ + DECAL_EPSILON,
          normal: new THREE.Vector3(0, 0, -1),
          uAxis: new THREE.Vector3(-1, 0, 0),
          vAxis: new THREE.Vector3(0, 1, 0),
        };
    }
  }

  private getFaceArrowAngle(face: FaceName, direction: AxisDirection): number {
    const descriptor = this.getFaceDescriptor(
      { id: '', x: 0, y: 0, z: 0, sizeX: 1, sizeY: 1, sizeZ: 1, direction, removed: false },
      face,
    );
    const world = WORLD_DIRECTION[direction];
    const projection = world.clone().sub(
      descriptor.normal.clone().multiplyScalar(world.dot(descriptor.normal)),
    );
    const u = projection.dot(descriptor.uAxis);
    const v = projection.dot(descriptor.vAxis);
    return Math.atan2(v, u);
  }

  private getWorldPosition(block: BlockData): THREE.Vector3 {
    if (!this.dimensions) {
      return new THREE.Vector3();
    }

    return new THREE.Vector3(
      (block.x + block.sizeX / 2 - this.dimensions.sizeX / 2) * CELL_SIZE,
      (block.y + block.sizeY / 2 - this.dimensions.sizeY / 2) * CELL_SIZE,
      (block.z + block.sizeZ / 2 - this.dimensions.sizeZ / 2) * CELL_SIZE,
    );
  }

  private setGroupOpacity(group: THREE.Group, opacity: number): void {
    group.traverse((node: THREE.Object3D) => {
      if (node instanceof THREE.Mesh) {
        if (node.userData.isPicker) {
          node.material.opacity = 0;
          return;
        }

        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          material.transparent = opacity < 1;
          material.opacity = opacity;
        }
      }

      if (node instanceof THREE.LineSegments) {
        node.material.transparent = opacity < 1;
        node.material.opacity = opacity * 0.38;
      }
    });
  }

  private createShatterBurst(visual: BlockVisual): void {
    const base = visual.group.position.clone();
    const tint = visual.body.material.color.clone();

    for (let index = 0; index < 12; index += 1) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.16),
        new THREE.MeshStandardMaterial({
          color: tint.clone().offsetHSL((Math.random() - 0.5) * 0.04, 0.08, (Math.random() - 0.5) * 0.08),
          roughness: 0.5,
          metalness: 0.04,
          transparent: true,
        }),
      );

      mesh.position.copy(base).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.46, (Math.random() - 0.5) * 0.46, (Math.random() - 0.5) * 0.46),
      );
      this.scene.add(mesh);
      this.burstFragments.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2.6, Math.random() * 2.4 + 0.8, (Math.random() - 0.5) * 2.6),
        spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
        bornAt: this.getNow(),
        duration: 320 + Math.random() * 140,
      });
    }
  }

  private updateBurstFragments(now: number): void {
    if (this.burstFragments.length === 0) {
      return;
    }

    this.invalidate();

    for (let index = this.burstFragments.length - 1; index >= 0; index -= 1) {
      const fragment = this.burstFragments[index];
      const progress = Math.min(1, (now - fragment.bornAt) / fragment.duration);
      fragment.mesh.position.addScaledVector(fragment.velocity, 1 / 60);
      fragment.velocity.y -= 0.08;
      fragment.mesh.rotation.x += fragment.spin.x * 0.012;
      fragment.mesh.rotation.y += fragment.spin.y * 0.012;
      fragment.mesh.rotation.z += fragment.spin.z * 0.012;
      fragment.mesh.material.opacity = 1 - progress;
      fragment.mesh.scale.setScalar(1 - progress * 0.35);

      if (progress >= 1) {
        fragment.mesh.geometry.dispose();
        fragment.mesh.material.dispose();
        this.scene.remove(fragment.mesh);
        this.burstFragments.splice(index, 1);
      }
    }
  }

  private getNow(): number {
    return this.manualNow ?? performance.now();
  }

  private updateAnimations(now: number): void {
    if (this.animations.size === 0) {
      return;
    }
    this.invalidate();
    const finished: string[] = [];

    for (const animation of this.animations.values()) {
      const visual = this.blockVisuals.get(animation.blockId);
      if (!visual) {
        finished.push(animation.blockId);
        animation.resolve();
        continue;
      }

      const progress = Math.min(1, (now - animation.startTime) / animation.duration);
      if (animation.removable) {
        const eased = 1 - Math.pow(1 - progress, 3);
        visual.group.position.copy(animation.origin).add(animation.offset.clone().multiplyScalar(eased));
        visual.group.scale.setScalar(1 - eased * 0.06);
        this.setGroupOpacity(visual.group, 1 - eased);
      } else {
        const attack = progress < 0.45 ? progress / 0.45 : 1 - (progress - 0.45) / 0.55;
        const eased = Math.max(0, attack);
        visual.group.position.copy(animation.origin).add(animation.offset.clone().multiplyScalar(eased));
      }

      if (progress >= 1) {
        visual.group.position.copy(animation.origin);
        visual.group.scale.setScalar(1);

        if (animation.removable) {
          visual.group.visible = false;
          visual.body.visible = false;
          visual.picker.visible = false;
          visual.edges.visible = false;
          for (const decal of visual.decals) {
            decal.visible = false;
          }
        } else {
          this.setGroupOpacity(visual.group, 1);
        }

        finished.push(animation.blockId);
        animation.resolve();
      }
    }

    for (const blockId of finished) {
      this.animations.delete(blockId);
    }
  }

  private invalidate(): void {
    this.dirty = true;
  }

  private handleControlsChange = (): void => {
    this.invalidate();
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.callbacks.onPointerActivity();
    this.pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const deltaX = event.clientX - this.pointerDown.x;
    const deltaY = event.clientY - this.pointerDown.y;
    const distance = Math.hypot(deltaX, deltaY);
    const elapsed = performance.now() - this.pointerDown.time;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const canvasPixelX = canvasX * (this.renderer.domElement.width / rect.width);
    const canvasPixelY = canvasY * (this.renderer.domElement.height / rect.height);

    if (distance >= 8 || elapsed >= 220) {
      this.logPickDebug({
        screenX: event.clientX,
        screenY: event.clientY,
        canvasX,
        canvasY,
        canvasPixelX,
        canvasPixelY,
        ndcX: 0,
        ndcY: 0,
        hitObjects: [],
        selectedBlockId: null,
        activeBlockCount: this.getActiveBlockCount(),
        clickableObjectCount: this.getPickTargets().length,
        failureReason: '被判定为拖动，未进入点击拾取流程',
      });
      return;
    }

    this.pointer.x = (canvasX / rect.width) * 2 - 1;
    this.pointer.y = -(canvasY / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const pickTargets = this.getPickTargets();
    const hits = this.raycaster.intersectObjects(pickTargets, false);

    let selectedBlockId: string | null = null;
    let failureReason: string | null = null;

    for (const hit of hits) {
      const blockId = this.resolveBlockId(hit.object);
      if (!blockId) {
        failureReason = '命中对象没有 blockId';
        continue;
      }

      const visual = this.blockVisuals.get(blockId);
      if (!visual) {
        failureReason = '命中 blockId 但拾取列表中缺失对应对象';
        continue;
      }

      if (visual.block.removed || !visual.group.visible || !visual.picker.visible) {
        failureReason = '命中了已移除或不可见的残留对象';
        continue;
      }

      selectedBlockId = blockId;
      break;
    }

    if (!selectedBlockId && !failureReason) {
      failureReason = hits.length === 0 ? '未命中任何可点击对象' : '命中列表存在，但没有可用 blockId';
    }

    this.logPickDebug({
      screenX: event.clientX,
      screenY: event.clientY,
      canvasX,
      canvasY,
      canvasPixelX,
      canvasPixelY,
      ndcX: this.pointer.x,
      ndcY: this.pointer.y,
      hitObjects: hits.map((hit) => ({
        name: hit.object.name,
        uuid: hit.object.uuid,
        blockId: this.resolveBlockId(hit.object),
        distance: hit.distance,
      })),
      selectedBlockId,
      activeBlockCount: this.getActiveBlockCount(),
      clickableObjectCount: pickTargets.length,
      failureReason,
    });

    if (selectedBlockId) {
      this.callbacks.onBlockSelect(selectedBlockId);
    }
  };

  private getPickTargets(): THREE.Object3D[] {
    return [...this.blockVisuals.values()]
      .filter((visual) => !visual.block.removed && visual.group.visible && visual.picker.visible)
      .map((visual) => visual.picker);
  }

  private getActiveBlockCount(): number {
    return [...this.blockVisuals.values()].filter((visual) => !visual.block.removed).length;
  }

  private resolveBlockId(object: THREE.Object3D | null): string | null {
    let cursor = object;
    while (cursor) {
      const blockId = cursor.userData.blockId;
      if (typeof blockId === 'string') {
        return blockId;
      }
      cursor = cursor.parent;
    }
    return null;
  }

  private logPickDebug(info: PickDebugInfo): void {
    if (!isDebugPickingEnabled()) {
      return;
    }

    console.groupCollapsed(
      `[DEBUG_PICKING] screen=(${info.screenX.toFixed(1)}, ${info.screenY.toFixed(1)}) selected=${
        info.selectedBlockId ?? 'none'
      }`,
    );
    console.log('pointer.screen', { x: info.screenX, y: info.screenY });
    console.log('pointer.canvasCss', { x: info.canvasX, y: info.canvasY });
    console.log('pointer.canvasPixel', { x: info.canvasPixelX, y: info.canvasPixelY });
    console.log('pointer.ndc', { x: info.ndcX, y: info.ndcY });
    console.log('raycast.hits', info.hitObjects);
    console.log('selected.blockId', info.selectedBlockId);
    console.log('logic.activeBlocks', info.activeBlockCount);
    console.log('picking.clickableObjects', info.clickableObjectCount);
    if (info.failureReason) {
      console.warn('failure.reason', info.failureReason);
    }
    console.groupEnd();
  }
}
