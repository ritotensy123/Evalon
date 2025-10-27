/**
 * Centralized utility functions for department management
 * Ensures consistency across all components
 */

// Department type configurations
export const DEPARTMENT_TYPES = {
  DEPARTMENT: 'department',
  SUB_DEPARTMENT: 'sub-department', 
  CLASS: 'class',
  SECTION: 'section'
};

// Institution type configurations
export const INSTITUTION_TYPES = {
  SCHOOL: 'school',
  COLLEGE: 'college',
  UNIVERSITY: 'university',
  INSTITUTE: 'institute'
};

// Academic type configurations
export const ACADEMIC_TYPES = {
  ACADEMIC: 'academic',
  ADMINISTRATIVE: 'administrative',
  SUPPORT: 'support',
  RESEARCH: 'research'
};

// Class level configurations
export const CLASS_LEVELS = {
  PRE_PRIMARY: 'pre-primary',
  PRIMARY: 'primary',
  MIDDLE: 'middle',
  SECONDARY: 'secondary',
  SENIOR_SECONDARY: 'senior-secondary'
};

/**
 * Get display name for a department based on its type and properties
 * @param {Object} department - Department object
 * @returns {string} Display name
 */
export const getDisplayName = (department) => {
  if (!department) return 'Unknown Department';
  
  const baseName = department.name || 'Unnamed Department';
  
  switch (department.departmentType) {
    case DEPARTMENT_TYPES.CLASS:
      // For classes, prioritize standard + section, fallback to name
      if (department.standard) {
        return `${department.standard}${department.section ? ` - ${department.section}` : ''}`;
      }
      return baseName;
      
    case DEPARTMENT_TYPES.SECTION:
      // For sections, show name with section info
      return `${baseName}${department.section ? ` (${department.section})` : ''}`;
      
    case DEPARTMENT_TYPES.SUB_DEPARTMENT:
      // For sub-departments, show name with specialization
      return `${baseName}${department.specialization ? ` (${department.specialization})` : ''}`;
      
    case DEPARTMENT_TYPES.DEPARTMENT:
    default:
      return baseName;
  }
};

/**
 * Get department type display name
 * @param {string} departmentType - Department type
 * @returns {string} Human-readable type name
 */
export const getDepartmentTypeDisplayName = (departmentType) => {
  const typeMap = {
    [DEPARTMENT_TYPES.DEPARTMENT]: 'Department',
    [DEPARTMENT_TYPES.SUB_DEPARTMENT]: 'Sub-Department',
    [DEPARTMENT_TYPES.CLASS]: 'Class',
    [DEPARTMENT_TYPES.SECTION]: 'Section'
  };
  
  return typeMap[departmentType] || 'Department';
};

/**
 * Get department type color scheme
 * @param {string} departmentType - Department type
 * @returns {Object} Color scheme object
 */
export const getDepartmentTypeColors = (departmentType) => {
  const colorSchemes = {
    [DEPARTMENT_TYPES.DEPARTMENT]: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: 'text-blue-600'
    },
    [DEPARTMENT_TYPES.SUB_DEPARTMENT]: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: 'text-purple-600'
    },
    [DEPARTMENT_TYPES.CLASS]: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: 'text-green-600'
    },
    [DEPARTMENT_TYPES.SECTION]: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: 'text-orange-600'
    }
  };
  
  return colorSchemes[departmentType] || colorSchemes[DEPARTMENT_TYPES.DEPARTMENT];
};

/**
 * Get department icon based on type
 * @param {string} departmentType - Department type
 * @returns {string} Icon component name
 */
export const getDepartmentIcon = (departmentType) => {
  const iconMap = {
    [DEPARTMENT_TYPES.DEPARTMENT]: 'Building',
    [DEPARTMENT_TYPES.SUB_DEPARTMENT]: 'TreePine',
    [DEPARTMENT_TYPES.CLASS]: 'GraduationCap',
    [DEPARTMENT_TYPES.SECTION]: 'Users'
  };
  
  return iconMap[departmentType] || 'Building';
};

/**
 * Check if a department is a class
 * @param {Object} department - Department object
 * @returns {boolean} True if department is a class
 */
export const isClass = (department) => {
  return department?.departmentType === DEPARTMENT_TYPES.CLASS || department?.isClass === true;
};

/**
 * Check if a department is a sub-department
 * @param {Object} department - Department object
 * @returns {boolean} True if department is a sub-department
 */
export const isSubDepartment = (department) => {
  return department?.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT;
};

/**
 * Check if a department is a section
 * @param {Object} department - Department object
 * @returns {boolean} True if department is a section
 */
export const isSection = (department) => {
  return department?.departmentType === DEPARTMENT_TYPES.SECTION;
};

/**
 * Get hierarchy level description
 * @param {Object} department - Department object
 * @returns {string} Level description
 */
export const getHierarchyDescription = (department) => {
  if (!department) return '';
  
  const parts = [];
  
  // Add institution type
  if (department.institutionType) {
    parts.push(department.institutionType.charAt(0).toUpperCase() + department.institutionType.slice(1));
  }
  
  // Add academic type for colleges
  if (department.institutionType === INSTITUTION_TYPES.COLLEGE && department.academicType) {
    parts.push(department.academicType.charAt(0).toUpperCase() + department.academicType.slice(1));
  }
  
  // Add specialization if available
  if (department.specialization) {
    parts.push(department.specialization);
  }
  
  return parts.join(' • ');
};

/**
 * Get class-specific information
 * @param {Object} department - Department object (should be a class)
 * @returns {Object} Class information
 */
export const getClassInfo = (department) => {
  if (!isClass(department)) return null;
  
  return {
    level: department.classLevel,
    standard: department.standard,
    section: department.section,
    academicYear: department.academicYear,
    semester: department.semester,
    batch: department.batch
  };
};

/**
 * Validate department hierarchy rules
 * @param {Object} department - Department object
 * @param {Object} parentDepartment - Parent department object
 * @returns {Object} Validation result
 */
export const validateHierarchy = (department, parentDepartment) => {
  const errors = [];
  const warnings = [];
  
  // Check if class can be created under the parent
  if (department.departmentType === DEPARTMENT_TYPES.CLASS) {
    if (parentDepartment && parentDepartment.departmentType === DEPARTMENT_TYPES.CLASS) {
      errors.push('Classes cannot be created under other classes');
    }
    
    if (parentDepartment && parentDepartment.departmentType === DEPARTMENT_TYPES.SECTION) {
      errors.push('Classes cannot be created under sections');
    }
  }
  
  // Check if section can be created under the parent
  if (department.departmentType === DEPARTMENT_TYPES.SECTION) {
    if (!parentDepartment) {
      errors.push('Sections must be created under a department or class');
    }
    
    if (parentDepartment && parentDepartment.departmentType === DEPARTMENT_TYPES.SECTION) {
      errors.push('Sections cannot be created under other sections');
    }
  }
  
  // Check if sub-department can be created under the parent
  if (department.departmentType === DEPARTMENT_TYPES.SUB_DEPARTMENT) {
    if (parentDepartment && parentDepartment.departmentType === DEPARTMENT_TYPES.CLASS) {
      warnings.push('Sub-departments under classes are unusual');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get department statistics
 * @param {Array} departments - Array of department objects
 * @returns {Object} Statistics object
 */
export const getDepartmentStats = (departments) => {
  if (!Array.isArray(departments)) return {};
  
  const stats = {
    total: departments.length,
    byType: {},
    byInstitution: {},
    byLevel: {}
  };
  
  departments.forEach(dept => {
    // Count by type
    stats.byType[dept.departmentType] = (stats.byType[dept.departmentType] || 0) + 1;
    
    // Count by institution type
    stats.byInstitution[dept.institutionType] = (stats.byInstitution[dept.institutionType] || 0) + 1;
    
    // Count by level
    stats.byLevel[dept.level] = (stats.byLevel[dept.level] || 0) + 1;
  });
  
  return stats;
};

/**
 * Sort departments by hierarchy and type
 * @param {Array} departments - Array of department objects
 * @returns {Array} Sorted departments
 */
export const sortDepartments = (departments) => {
  if (!Array.isArray(departments)) return [];
  
  return departments.sort((a, b) => {
    // First by level
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    
    // Then by department type priority
    const typePriority = {
      [DEPARTMENT_TYPES.DEPARTMENT]: 1,
      [DEPARTMENT_TYPES.SUB_DEPARTMENT]: 2,
      [DEPARTMENT_TYPES.CLASS]: 3,
      [DEPARTMENT_TYPES.SECTION]: 4
    };
    
    const aPriority = typePriority[a.departmentType] || 5;
    const bPriority = typePriority[b.departmentType] || 5;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally by name
    return (a.name || '').localeCompare(b.name || '');
  });
};

/**
 * Build department tree structure
 * @param {Array} departments - Flat array of departments
 * @returns {Array} Tree structure
 */
export const buildDepartmentTree = (departments) => {
  if (!Array.isArray(departments)) return [];
  
  const sortedDepartments = sortDepartments(departments);
  const departmentMap = new Map();
  const roots = [];
  
  // Create map for quick lookup
  sortedDepartments.forEach(dept => {
    departmentMap.set(dept._id, { ...dept, children: [] });
  });
  
  // Build tree structure
  sortedDepartments.forEach(dept => {
    const departmentNode = departmentMap.get(dept._id);
    
    if (dept.parentDepartment) {
      const parent = departmentMap.get(dept.parentDepartment);
      if (parent) {
        parent.children.push(departmentNode);
      } else {
        // Parent not found, treat as root
        roots.push(departmentNode);
      }
    } else {
      roots.push(departmentNode);
    }
  });
  
  return roots;
};

