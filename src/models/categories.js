import db from './db.js'

const getAllCategories = async() => {
    const query = `
        SELECT category_id, name
      FROM public.category
      ORDER BY name;
    `;

    const result = await db.query(query);

    return result.rows;
}

const getCategoryDetails = async (categoryId) => {
    const query = `
        SELECT category_id, name
      FROM public.category
      WHERE category_id = $1;
    `;

    const queryParams = [categoryId];
    const result = await db.query(query, queryParams);

    // Return the first row of the result set, or null if no rows are found
    return result.rows.length > 0 ? result.rows[0] : null;
}

const getCategoriesByProjectId = async (projectId) => {
    const query = `
        SELECT c.category_id, c.name
      FROM public.category c
      JOIN public.project_category pc ON c.category_id = pc.category_id
      WHERE pc.project_id = $1
      ORDER BY c.name;
    `;

    const queryParams = [projectId];
    const result = await db.query(query, queryParams);

    return result.rows;
}

/**
 * Links one category to one project in the project_category junction table.
 * Only used inside this file, so it is not exported.
 * @param {string} categoryId - The id of the category.
 * @param {string} projectId - The id of the project.
 */
const assignCategoryToProject = async(categoryId, projectId) => {
    const query = `
        INSERT INTO project_category (category_id, project_id)
        VALUES ($1, $2);
    `;

    await db.query(query, [categoryId, projectId]);
}

/**
 * Replaces all of a project's category assignments with a new set.
 * @param {string} projectId - The id of the project.
 * @param {string[]} categoryIds - The ids of the categories the project should have.
 */
const updateCategoryAssignments = async(projectId, categoryIds) => {
    // First, remove existing category assignments for the project
    const deleteQuery = `
        DELETE FROM project_category
        WHERE project_id = $1;
    `;
    await db.query(deleteQuery, [projectId]);

    // Next, add the new category assignments
    for (const categoryId of categoryIds) {
        await assignCategoryToProject(categoryId, projectId);
    }
}

/**
 * Creates a new category in the database.
 * @param {string} name - The name of the category.
 * @returns {number} The id of the newly created category record.
 */
const createCategory = async (name) => {
    const query = `
      INSERT INTO category (name)
      VALUES ($1)
      RETURNING category_id;
    `;

    const queryParams = [name];
    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        throw new Error('Failed to create category');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new category with ID:', result.rows[0].category_id);
    }

    return result.rows[0].category_id;
};

/**
 * Updates an existing category in the database.
 * @param {string} categoryId - The id of the category to update.
 * @param {string} name - The new name of the category.
 * @returns {number} The id of the updated category record.
 */
const updateCategory = async (categoryId, name) => {
    const query = `
      UPDATE category
      SET name = $1
      WHERE category_id = $2
      RETURNING category_id;
    `;

    const queryParams = [name, categoryId];
    const result = await db.query(query, queryParams);

    // No row was updated, so no category has this ID.
    // Tag the error as a 404 so the global error handler shows the "not found" page
    if (result.rows.length === 0) {
        const err = new Error('Category Not Found');
        err.status = 404;
        throw err;
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Updated category with ID:', categoryId);
    }

    return result.rows[0].category_id;
};

// Export the model functions
export {
    getAllCategories,
    getCategoryDetails,
    getCategoriesByProjectId,
    updateCategoryAssignments,
    createCategory,
    updateCategory
}
