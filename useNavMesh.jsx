import * as THREE from "three";
import { NavMeshLoader, Vector3 } from "yuka";
import { create } from "zustand";
import { createConvexRegionHelper } from "../utils/createConvexRegionHelper";

export const useNavMesh = create((set, get) => ({
  raycaster: new THREE.Raycaster(),
  camera: null,
  viewport: new THREE.Vector2(window.innerWidth, window.innerHeight),
  clock: null,
  navMesh: null,
  intersects: new Vector3(),
  mutation: {
    mouse: { x: 0, y: 0 },
  },
  refs: {
    level: null,
    pathHelper: null,
  },
  level: {
    geometry: new THREE.BufferGeometry(),
    material: new THREE.MeshBasicMaterial(),
  },
  actions: {
    init(camera) {
      set({ camera });
    },
    loadNavMesh(url) {
      const loader = new NavMeshLoader();
      loader.load(url).then((navMesh) => {
        const { geometry, material } = createConvexRegionHelper(navMesh);
        set({ navMesh });
        set({ level: { geometry, material } });
      });
    },
    updateMouse({ clientX, clientY }) {
      const { viewport, mutation } = get();

      mutation.mouse.x = (clientX / viewport.x) * 2 - 1;
      mutation.mouse.y = -(clientY / viewport.y) * 2 + 1;
    },
    handleMouseDown() {
      const { mutation, raycaster, camera, refs } = get();
      if (!refs.level) {
        return null;
      }

      raycaster.setFromCamera(mutation.mouse, camera);

      const intersects = raycaster.intersectObject(refs.level);

      if (intersects.length > 0) {
        const point = new Vector3().copy(intersects[0].point);
        set({ intersects: point });
      }
    },
    setPosition(position) {
      set({ intersects: position });
    },
  },
}));
