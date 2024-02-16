/* eslint-disable react/prop-types */
import { BallCollider, CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useYuka } from "./useYuka";
import { Vehicle } from "yuka";
import getRandomArbitrary from "./RandomCalculations";
import { Vector3 } from "three";
import { useEffect, useRef } from "react";
import { useNavMesh } from "./useNavMesh";

export function NavMeshAgent({
  name = "agent",
  agentId = null,
  position = [getRandomArbitrary(0, 60), 2, getRandomArbitrary(0, 60)],
  navPoints = [new Vector3(10, 2, 10), new Vector3(60, 2, 60)],
  maxSpeed = getRandomArbitrary(3, 10),
  maxForce = getRandomArbitrary(30, 60),
  isRandomNav = false,
  removed = false,
  isPlayerDetected = false,
  collisionSize = 10,
  capsuleColliderSize = [1, 1, 0.2],
  ...props
}) {
  const [refYuka] = useYuka({
    type: Vehicle,
    name,
    agentId,
    position,
    navPoints,
    isRandomNav,
    isPlayerDetected,
    maxSpeed,
    removed,
    maxForce,
    ...props,
  });

  const actions = useNavMesh((state) => state.actions);
  const agentControl = useRef({ playerDetected: false });

  // const Attacked = (event) => {
  //   if (event.rigidBodyObject.name == "Player") {
  //     console.log("Attacked");
  //   }
  // };

  useEffect(() => {
    return () => console.log("Destroyed", agentId);
  }, []);

  return (
    <RigidBody
      ref={refYuka}
      colliders={false}
      linearDamping={0}
      type="kinematicPosition"
      agentId={agentId}
      position={position}
      name="Enemy"
      lockRotations
    >
      <CapsuleCollider args={capsuleColliderSize} position={[0, 0, 0]}>
        {props.children}
      </CapsuleCollider>
      <BallCollider
        onIntersectionEnter={(object) => {
          if (
            !agentControl.current.playerDetected &&
            object.rigidBodyObject.name == "Player"
          ) {
            actions.agentDetectPlayerTrigger(agentId, true);
          }
        }}
        args={[collisionSize]}
        position={[0, 0, 0]}
        sensor
      />
    </RigidBody>
  );
}
