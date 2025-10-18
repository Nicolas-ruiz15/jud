// components/admin/CategorySelector.js
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

const CategorySelector = ({
  value = [],
  onChange,
  multiple = true,
  placeholder = "Seleccionar categorías...",
  maxHeight = "200px",
  showHierarchy = true,
  allowCreate = false,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(value);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategories(value);
  }, [value]);

  useEffect(() => {
    filterCategories();
  }, [categories, debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories?limit=100&include_children=true', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        // Crear estructura jerárquica plana para el selector
        const flatCategories = flattenCategories(data.data);
        setCategories(flatCategories);
        setFilteredCategories(flatCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const flattenCategories = (categories, level = 0, parentName = '') => {
    let result = [];
    
    categories.forEach(category => {
      const displayName = showHierarchy && level > 0 
        ? `${'  '.repeat(level)}↳ ${category.name}`
        : category.name;
        
      result.push({
        ...category,
        displayName,
        level,
        parentName,
        fullPath: parentName ? `${parentName} > ${category.name}` : category.name
      });

      if (category.children && category.children.length > 0) {
        result = result.concat(
          flattenCategories(category.children, level + 1, category.name)
        );
      }
    });
    
    return result;
  };

  const filterCategories = () => {
    if (!debouncedSearchTerm) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      category.fullPath.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    setFilteredCategories(filtered);
  };

  const handleSelect = (category) => {
    if (disabled) return;

    let newSelected;
    
    if (multiple) {
      const isSelected = selectedCategories.some(cat => 
        typeof cat === 'object' ? cat.id === category.id : cat === category.id
      );
      
      if (isSelected) {
        newSelected = selectedCategories.filter(cat => 
          typeof cat === 'object' ? cat.id !== category.id : cat !== category.id
        );
      } else {
        newSelected = [...selectedCategories, category];
      }
    } else {
      newSelected = [category];
      setIsOpen(false);
    }

    setSelectedCategories(newSelected);
    onChange(newSelected);
    
    if (multiple) {
      setSearchTerm('');
      inputRef.current?.focus();
    }
  };

  const handleRemove = (categoryToRemove) => {
    if (disabled) return;
    
    const newSelected = selectedCategories.filter(cat => 
      typeof cat === 'object' 
        ? cat.id !== (typeof categoryToRemove === 'object' ? categoryToRemove.id : categoryToRemove)
        : cat !== (typeof categoryToRemove === 'object' ? categoryToRemove.id : categoryToRemove)
    );
    
    setSelectedCategories(newSelected);
    onChange(newSelected);
  };

  const isSelected = (category) => {
    return selectedCategories.some(cat => 
      typeof cat === 'object' ? cat.id === category.id : cat === category.id
    );
  };

  const getSelectedNames = () => {
    return selectedCategories.map(cat => 
      typeof cat === 'object' ? cat.name : 
      categories.find(c => c.id === cat)?.name || 'Categoría no encontrada'
    );
  };

  const handleCreateNew = async () => {
    if (!allowCreate || !searchTerm.trim()) return;
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: searchTerm.trim(),
          slug: searchTerm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          status: 'active'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newCategory = data.data;
        setCategories(prev => [...prev, { ...newCategory, displayName: newCategory.name, level: 0 }]);
        handleSelect(newCategory);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input principal */}
      <div
        className={`min-h-[42px] w-full px-3 py-2 border rounded-md bg-white cursor-pointer transition-colors ${
          disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : isOpen 
              ? 'border-primary-500 ring-2 ring-primary-200' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {/* Categorías seleccionadas */}
          {selectedCategories.length > 0 ? (
            selectedCategories.map((category, index) => {
              const categoryName = typeof category === 'object' ? category.name : 
                categories.find(c => c.id === category)?.name || 'Categoría no encontrada';
              
              return (
                <span
                  key={typeof category === 'object' ? category.id : category}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-md"
                >
                  {categoryName}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(category);
                      }}
                      className="text-primary-600 hover:text-primary-800 ml-1"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-gray-500 text-sm py-1">{placeholder}</span>
          )}
          
          {/* Input de búsqueda */}
          {isOpen && !disabled && (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
              placeholder="Buscar categorías..."
              autoFocus
            />
          )}
        </div>
        
        {/* Indicador de dropdown */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto" style={{ maxHeight }}>
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto mb-2"></div>
                Cargando categorías...
              </div>
            ) : (
              <>
                {filteredCategories.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p className="mb-2">No se encontraron categorías</p>
                        {allowCreate && (
                          <button
                            onClick={handleCreateNew}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            + Crear "{searchTerm}"
                          </button>
                        )}
                      </div>
                    ) : (
                      'No hay categorías disponibles'
                    )}
                  </div>
                ) : (
                  <>
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected(category)
                            ? 'bg-primary-100 text-primary-900'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelect(category)}
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          {category.icon && (
                            <span className="text-sm">{category.icon}</span>
                          )}
                          <span className={`text-sm ${category.level > 0 ? 'font-normal' : 'font-medium'}`}>
                            {category.displayName}
                          </span>
                          {category.status === 'inactive' && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {category.product_count > 0 && (
                            <span>{category.product_count} productos</span>
                          )}
                          {isSelected(category) && (
                            <span className="text-primary-600">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Opción para crear nueva categoría */}
                    {allowCreate && searchTerm && !filteredCategories.some(cat => 
                      cat.name.toLowerCase() === searchTerm.toLowerCase()
                    ) && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200 text-primary-600"
                        onClick={handleCreateNew}
                      >
                        <div className="flex items-center space-x-2">
                          <span>+</span>
                          <span className="text-sm">Crear "{searchTerm}"</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;