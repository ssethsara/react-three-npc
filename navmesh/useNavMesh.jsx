import * as THREE from "three";
import { NavMeshLoader, Vector3 } from "yuka";
import { create } from "zustand";
import { createConvexRegionHelper } from "./createConvexRegionHelper";

export const useNavMesh = create((set, get) => ({
  navMesh: null,
  intersects: new Vector3(),
  agentList: [],
  mutation: {
    mouse: { x: 0, y: 0 },
  },
  level: {
    geometry: new THREE.BufferGeometry(),
    material: new THREE.MeshBasicMaterial(),
  },
  actions: {
    loadNavMesh(url) {
      const loader = new NavMeshLoader();
      loader.load(url).then((navMesh) => {
        const { geometry, material } = createConvexRegionHelper(navMesh);
        set({ navMesh });
        set({ level: { geometry, material } });
      });
    },

    setPosition(position) {
      set({ intersects: position });
    },

    setAgentList(agentList) {
      set({ agentList: agentList });
    },

    /**
     * use to make agent follow player
     */
    agentDetectPlayerTrigger(agentId, active) {
      const { agentList } = get();
      const selectedAgent = agentList.current.find((agentData) => {
        return agentData.agent.agentId === agentId;
      });
      selectedAgent.agent.isPlayerDetected = active;
      set({ agentList: agentList });
    },

    /**
     * use to stop agent from moving
     */
    freezeAgentTrigger(agentId) {
      const { agentList } = get();
      const selectedAgent = agentList.current.find((agentData) => {
        return agentData.agent.agentId === agentId;
      });
      selectedAgent.followPathBehavior.active =
        !selectedAgent.followPathBehavior.active;
      selectedAgent.onPathBehavior.active =
        !selectedAgent.followPathBehavior.active;

      selectedAgent.agent.navRef.current.setEnabled(false);
      selectedAgent.agent.velocity = new Vector3(0, 0, 0);
      set({ agentList: agentList });
    },

    /**
     * use to remove agent from agent list
     */
    removeAgent(agentId) {
      const { agentList } = get();
      const selectedAgent = agentList.current.find((agentData) => {
        return agentData.agent.agentId === agentId;
      });
      if (selectedAgent) {
        selectedAgent.followPathBehavior.active = false;
        selectedAgent.onPathBehavior.active = false;
        selectedAgent.agent.navRef.current.setEnabled(false);
        selectedAgent.agent.velocity = new Vector3(0, 0, 0);
        agentList.current = agentList.current.filter((agentData) => {
          return agentData.agent.agentId !== agentId;
        });
      }
      set({ agentList: agentList });
    },
  },
}));
