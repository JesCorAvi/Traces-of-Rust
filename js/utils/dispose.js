// Liberación de geometrías y materiales de un árbol Object3D.
// Exports: disposeObject3D.

export function disposeObject3D(root) {
  root.traverse(obj => {
    if (!obj.userData.sharedGeo && obj.geometry) obj.geometry.dispose();
    if (!obj.userData.sharedMat && obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}
