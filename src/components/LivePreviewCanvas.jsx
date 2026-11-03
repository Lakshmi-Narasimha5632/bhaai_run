import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterModel } from '../game/CharacterModel';
import { PoliceChaserModel } from '../game/PoliceChaserModel';
import { createTrainMesh, createCoinMesh, createObstacleMesh, disposeHierarchy } from '../game/ObjectModels';

export default function LivePreviewCanvas({ type = 'character', config = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDisposed = false;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // Turn off AA for faster lightweight preview
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xfff5ea, 1.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Grid platform
    const grid = new THREE.GridHelper(10, 10, 0xf59e0b, 0x334155);
    grid.position.y = 0;
    scene.add(grid);

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);

    let charInstance = null;
    let animId = null;

    async function loadItem() {
      if (isDisposed) return;
      while (previewGroup.children.length > 0) {
        const c = previewGroup.children[0];
        previewGroup.remove(c);
        disposeHierarchy(c);
      }

      if (type === 'character') {
        charInstance = new CharacterModel(config.character || {});
        previewGroup.add(charInstance.root);
        camera.position.set(0, 1.6, 4.2);
        camera.lookAt(0, 1.3, 0);
      } else if (type === 'train') {
        const train = await createTrainMesh(config.train || {});
        train.scale.set(0.45, 0.45, 0.45);
        previewGroup.add(train);
        camera.position.set(0, 2.8, 11);
        camera.lookAt(0, 1.5, 0);
      } else if (type === 'coin') {
        const coin = await createCoinMesh(config.coin || {});
        coin.scale.set(1.8, 1.8, 1.8);
        coin.position.y = 1.0;
        previewGroup.add(coin);
        camera.position.set(0, 1.2, 3.5);
        camera.lookAt(0, 1.0, 0);
      } else if (type === 'obstacle') {
        const obs = await createObstacleMesh(config.obstacle?.selectedPreset || 'barrier', config.obstacle || {});
        obs.scale.set(1.0, 1.0, 1.0);
        previewGroup.add(obs);
        camera.position.set(0, 1.8, 4.5);
        camera.lookAt(0, 1.2, 0);
      } else if (type === 'police') {
        const police = new PoliceChaserModel();
        previewGroup.add(police.root);
        charInstance = police;
        camera.position.set(0, 1.8, 4.2);
        camera.lookAt(0, 1.3, 0);
      } else {
        const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.y = 1.3;
        previewGroup.add(sphere);
        camera.position.set(0, 1.5, 4.0);
        camera.lookAt(0, 1.2, 0);
      }
    }

    loadItem();

    const clock = new THREE.Clock();

    function animate() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);

      if (charInstance) {
        charInstance.update(delta, 20);
        previewGroup.rotation.y += delta * 0.5;
      } else {
        previewGroup.rotation.y += delta * 0.8;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      disposeHierarchy(previewGroup);
      renderer.dispose();
    };
  }, [type, config.character?.selectedId, config.character?.customImageUrl, config.train?.selectedPreset, config.coin?.shape, config.obstacle?.selectedPreset]);

  return (
    <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-900/90 shadow-inner flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-2 right-3 text-[11px] font-mono tracking-wider text-amber-400/80 bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-500/20 pointer-events-none">
        3D LIVE PREVIEW
      </div>
    </div>
  );
}
