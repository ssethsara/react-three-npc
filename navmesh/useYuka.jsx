/* eslint-disable react/prop-types */
import { useRef, useEffect, useState, useContext, createContext } from "react";
import {
  GameEntity,
  EntityManager,
  FollowPathBehavior,
  OnPathBehavior,
  Vector3,
  ObstacleAvoidanceBehavior,
  Smoother,
} from "yuka";
import { useNavMesh } from "./useNavMesh";
import { useFrame } from "@react-three/fiber";
import getRandomArbitrary from "./RandomCalculations";

const context = createContext();

export function Manager({ children }) {
  const [mgr] = useState(() => new EntityManager());
  const agentListRef = useRef([]);
  const managerControl = useRef({ start: false });
  const navMesh = useNavMesh((state) => state.navMesh);
  const agentList = useNavMesh((state) => state.agentList);
  const actions = useNavMesh((state) => state.actions);

  useEffect(() => {
    if (!navMesh) {
      return;
    }
    const agents = mgr.entities.filter((item) => item.name === "Enemy");

    agents.forEach((agent) => {
      agent.boundingRadius = 1;
      agent.smoother = new Smoother(20);
      // Set up agent
      const followPathBehavior = new FollowPathBehavior();
      const onPathBehavior = new OnPathBehavior();

      //this avoid agent collide with each other
      const obstaclesAvoidenceBehavior = new ObstacleAvoidanceBehavior(agents);

      obstaclesAvoidenceBehavior.active = false;
      obstaclesAvoidenceBehavior.brakingWeight = 0.1;
      obstaclesAvoidenceBehavior.weight = 5;
      obstaclesAvoidenceBehavior.dBoxMinLength = 5;
      followPathBehavior.active = false;
      onPathBehavior.active = false;
      onPathBehavior.radius = 1;
      agent.steering.add(obstaclesAvoidenceBehavior);
      agent.steering.add(followPathBehavior);
      agent.steering.add(onPathBehavior);

      agentListRef.current.push({
        agent: agent,
        followPathBehavior: followPathBehavior,
        onPathBehavior: onPathBehavior,
        obstaclesAvoidenceBehavior: obstaclesAvoidenceBehavior,
      });
    });

    actions.setAgentList(agentListRef);

    useNavMesh.subscribe((intersects) => findPathTo(intersects));

    const setPaths = (agentDate, from, to) => {
      const path = navMesh.findPath(from, to);
      agentDate.onPathBehavior.path.clear();
      agentDate.followPathBehavior.path.clear();
      agentDate.onPathBehavior.active = true;
      agentDate.followPathBehavior.active = true;
      agentDate.obstaclesAvoidenceBehavior.active = true;

      for (const point of path) {
        agentDate.followPathBehavior.path.add(point);
        agentDate.onPathBehavior.path.add(point);
      }
    };

    const findPathTo = (target) => {
      target.agentList.current.forEach((agentDate) => {
        const navPointsCount = agentDate.agent.navPoints.length;
        if (agentDate.agent.isPlayerDetected) {
          const from = agentDate.agent.position;
          const to = new Vector3(
            target.intersects.x,
            target.intersects.y,
            target.intersects.z
          );
          setPaths(agentDate, from, to);
        } else if (navPointsCount > 0) {
          const pathData = setRoamingPath(agentDate.agent, navPointsCount);
          setPaths(agentDate, pathData.from, pathData.to);
        }
      });
    };
  }, [navMesh]);

  const setRoamingPath = (agent, navPointsCount) => {
    let currentPointIndex = agent.currentNavPoint;
    const from = agent.position;
    let to = agent.navPoints[currentPointIndex];
    if (from.distanceTo(to) < 0.5 && navPointsCount > 1) {
      currentPointIndex =
        currentPointIndex < navPointsCount - 1 ? currentPointIndex + 1 : 0;
      to = agent.navPoints[currentPointIndex];
      agent.currentNavPoint = currentPointIndex;
    }
    const toVec3 = new Vector3(to.x, to.y, to.z);
    return { from: from, to: toVec3 };
  };

  useFrame((state, delta) => {
    mgr.update(delta);
  });

  return <context.Provider value={mgr}>{children}</context.Provider>;
}

export function useYuka({
  type = GameEntity,
  agentId = null,
  position = [getRandomArbitrary(0, 60), 2, getRandomArbitrary(0, 60)],
  name = "unnamed",
  navPoints = [],
  isRandomNav = false,
  isPlayerDetected = false,
  maxForce,
  removed,
  maxSpeed,
}) {
  // This hook makes set-up re-usable
  const ref = useRef();
  const mgr = useContext(context);
  const [entity] = useState(() => new type());
  useEffect(() => {
    entity.position.set(...position);
    entity.agentId = agentId;
    entity.name = name;
    entity.maxForce = maxForce;
    entity.maxSpeed = maxSpeed;
    entity.isRandomNav = isRandomNav;
    entity.currentNavPoint = 0;
    entity.isPlayerDetected = isPlayerDetected;
    entity.navPoints = navPoints;
    entity.navRef = ref;
    entity.removed = removed;
    entity.setRenderComponent(ref, (entity) => {
      ref.current.setTranslation(entity.position);
      ref.current.setRotation(entity.rotation);
    });
    console.log("entity", entity);
    mgr.add(entity);
    return () => {
      const removingEntity = mgr.entities.find(
        (item) => item.agentId === entity.agentId
      );
      mgr.remove(removingEntity);
    };
  }, []);
  return [ref, entity];
}
