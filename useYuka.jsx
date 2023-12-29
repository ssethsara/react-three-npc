import { useRef, useEffect, useState, useContext, createContext } from "react";
import {
  GameEntity,
  EntityManager,
  FollowPathBehavior,
  OnPathBehavior,
  Vector3,
} from "yuka";
import { useNavMesh } from "../stores/useNavMesh";
import { useFrame } from "@react-three/fiber";

const context = createContext();

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

export function Manager({ children }) {
  const [mgr] = useState(() => new EntityManager());
  const playerList = useRef([]);
  const navMesh = useNavMesh((state) => state.navMesh);

  useEffect(() => {
    if (!navMesh) {
      return;
    }

    const players = mgr.entities.filter((item) => item.name === "Enemy");
    // const ghost = mgr.entities.find((item) => item.name === "Ghost");

    players.forEach((player) => {
      // Set up player
      const followPathBehavior = new FollowPathBehavior();
      const onPathBehavior = new OnPathBehavior();
      player.maxSpeed = getRandomArbitrary(3, 10);
      player.maxForce = getRandomArbitrary(30, 60);
      followPathBehavior.active = false;
      onPathBehavior.active = false;
      onPathBehavior.radius = 1;
      player.steering.add(followPathBehavior);
      player.steering.add(onPathBehavior);

      playerList.current.push({
        player: player,
        followPathBehavior: followPathBehavior,
        onPathBehavior: onPathBehavior,
      });

      // // Set up ghost
      // const seekBehavior = new OffsetPursuitBehavior(
      //   player,
      //   new Vector3(1, 0, 1)
      // );

      // ghost.steering.add(seekBehavior);
      // ghost.maxSpeed = 2;
      // ghost.position.z = -5;
    });

    useNavMesh.subscribe(
      (intersects) => findPathTo(intersects),
      (state) => state.intersects
    );

    function findPathTo(target) {
      playerList.current.forEach((playerDate) => {
        const from = playerDate.player.position;
        const to = new Vector3(
          target.intersects.x,
          target.intersects.y,
          target.intersects.z
        );
        const path = navMesh.findPath(from, to);

        playerDate.onPathBehavior.active = true;
        playerDate.onPathBehavior.path.clear();
        playerDate.followPathBehavior.active = true;
        playerDate.followPathBehavior.path.clear();

        // refs.pathHelper.visible = true;
        // refs.pathHelper.geometry.dispose();
        // refs.pathHelper.geometry = new THREE.BufferGeometry().setFromPoints(path);

        for (const point of path) {
          playerDate.followPathBehavior.path.add(point);
          playerDate.onPathBehavior.path.add(point);
        }
      });
    }
  }, [navMesh]);

  useFrame((state, delta) => mgr.update(delta));

  return <context.Provider value={mgr}>{children}</context.Provider>;
}

export function useYuka({
  type = GameEntity,
  position = [getRandomArbitrary(0, 60), 1, getRandomArbitrary(0, 60)],
  name = "unnamed",
}) {
  // This hook makes set-up re-usable
  const ref = useRef();
  const mgr = useContext(context);
  const [entity] = useState(() => new type());
  useEffect(() => {
    entity.position.set(...position);
    entity.name = name;
    entity.setRenderComponent(ref, (entity) => {
      ref.current.setTranslation(entity.position);
      ref.current.setRotation(entity.rotation);
      // ref.current.position.copy(entity.position);
      // ref.current.quaternion.copy(entity.rotation);
    });
    mgr.add(entity);
    return () => mgr.remove(entity);
  }, []);
  return [ref, entity];
}
