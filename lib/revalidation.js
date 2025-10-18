// lib/revalidation.js - Helper para revalidación
export const revalidateProductPages = async (res, productSlug = null) => {
  const pages = [
    '/', // Homepage
    '/productos', // Página de productos
  ];

  if (productSlug) {
    pages.push(`/productos/${productSlug}`);
  }

  const results = [];
  
  for (const path of pages) {
    try {
      await res.revalidate(path);
      results.push({ path, success: true });
    } catch (error) {
      console.warn(`Error revalidating ${path}:`, error);
      results.push({ path, success: false, error: error.message });
    }
  }

  return results;
};

export const revalidateCategoryPages = async (res, categorySlug = null) => {
  const pages = [
    '/',
    '/productos',
    '/categorias'
  ];

  if (categorySlug) {
    pages.push(`/categorias/${categorySlug}`);
  }

  const results = [];
  
  for (const path of pages) {
    try {
      await res.revalidate(path);
      results.push({ path, success: true });
    } catch (error) {
      console.warn(`Error revalidating ${path}:`, error);
      results.push({ path, success: false, error: error.message });
    }
  }

  return results;
};