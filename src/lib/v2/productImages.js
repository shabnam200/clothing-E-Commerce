export function getColorGallery(product, color) {
  const wanted = String(color ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!wanted) return [];
  const value = Object.entries(product?.colorImages || {}).find(([name]) =>
    String(name).trim().toLowerCase().replace(/\s+/g, ' ') === wanted
  )?.[1];
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

export function getProductGallery(product, color) {
  const allImages = [...new Set((product?.images?.length ? product.images : [product?.image]).filter(Boolean))];
  if (product?.colors?.length && color) {
    const colorImages = getColorGallery(product, color);
    // Show selected-color photos first, then the product's common cover/gallery.
    // Those generic photos were already separated from other color photos by the API mapper.
    const commonImages = product?.hasPhoto === false ? [] : allImages;
    return [...new Set([...colorImages, ...commonImages])];
  }
  return allImages;
}
