// LEGACY MUERTO: no importado por el juego; carga assets/ y models/ antiguos. No leer ni usar.
// Exports: Textures, ModelFactory.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function loadTex(path, repeat = 1) {
  const tex = loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}

export const Textures = {
  player: loadTex('./assets/player.png'),
  zombie: loadTex('./assets/zombie.png'),
  weeper: loadTex('./assets/weeper.png'),
  worm:   loadTex('./assets/worm.png'),
  slash:  loadTex('./assets/slash.png'),
  spike:  loadTex('./assets/spike.png'),
  tree:   loadTex('./assets/tree.png'),
  ground: loadTex('./assets/ground.png', 70)
};

export const ModelFactory = {
  createHunter3D() {
    const g = new THREE.Group();
    const cloak = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.5, 7),
      new THREE.MeshStandardMaterial({ color: 0x1c1926, roughness: 0.9, flatShading: true })
    );
    cloak.position.y = 0.75;
    const head = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 1),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, flatShading: true })
    );
    head.position.y = 1.55;
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x09080d, flatShading: true })
    );
    hat.position.y = 1.82;
    const lantern = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.24, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    lantern.position.set(0.45, 1.05, -0.25);
    g.add(cloak, head, hat, lantern);
    return g;
  },

  createEnemy3D(type) {
    const g = new THREE.Group();
    if (type === 'weeper') {
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 2.0, 6),
        new THREE.MeshStandardMaterial({ color: 0x6b7280, flatShading: true })
      );
      robe.position.y = 1.0;
      const head = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.3, 0),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, flatShading: true })
      );
      head.position.y = 2.1;
      g.add(robe, head);
    } else if (type === 'worm') {
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.42 - i * 0.06, 0),
          new THREE.MeshStandardMaterial({ color: 0x7f1d1d, flatShading: true })
        );
        seg.position.set(0, 0.45 + i * 0.25, i * 0.18);
        g.add(seg);
      }
    } else {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.15, 0.4),
        new THREE.MeshStandardMaterial({
          color: type === 'boss' ? 0x991b1b : 0x365314,
          flatShading: true
        })
      );
      body.position.y = 0.7;
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.42),
        new THREE.MeshStandardMaterial({ color: 0x4d7c0f, flatShading: true })
      );
      head.position.y = 1.5;
      g.add(body, head);
      if (type === 'boss') g.scale.setScalar(2.2);
    }
    return g;
  }
};