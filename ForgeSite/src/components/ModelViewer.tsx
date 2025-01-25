import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'

import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { useLoader } from '@react-three/fiber'

const ForgeModel = () => {
  const geometry = useLoader(STLLoader, '/models/Forge.stl')
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#F95E1D" />
      <Edges scale={1} threshold={15} color="#ffffff" />
    </mesh>
  )
}

const AnvilModel = () => {
  const geometry = useLoader(STLLoader, '/models/anvil.stl')
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#4287f5" />
      <Edges scale={1} threshold={15} color="#ffffff" />
    </mesh>
  )
}

const HammerModel = () => {
  const geometry = useLoader(STLLoader, '/models/hammer.stl')
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#42f54b" />
      <Edges scale={1} threshold={15} color="#ffffff" />
    </mesh>
  )
}

const ModelViewer = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '20px', 
    }}>
      {/* Main Forge Model */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '400px' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <ForgeModel />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      {/* Secondary Models Row */}
      <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ flex: 1, height: '250px' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <AnvilModel />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>

        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ flex: 1, height: '250px' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <HammerModel />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
    </div>
  )
}

export default ModelViewer