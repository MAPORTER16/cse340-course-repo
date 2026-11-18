import db from './db.js'

const getAllProjects = async() => {
    const query = `
        SELECT p.project_id, p.organization_id, p.title, p.description, p.location, p.date,
            o.name AS organization_name
      FROM public.project p
      JOIN public.organization o ON p.organization_id = o.organization_id
      ORDER BY p.date;
    `;

    const result = await db.query(query);

    return result.rows;
}

const getProjectsByOrganizationId = async (organizationId) => {
    const query = `
        SELECT project_id, organization_id, title, description, location, date
      FROM public.project
      WHERE organization_id = $1
      ORDER BY date;
    `;

    const queryParams = [organizationId];
    const result = await db.query(query, queryParams);

    return result.rows;
}

const getUpcomingProjects = async (number_of_projects) => {
    const query = `
        SELECT p.project_id, p.title, p.description, p.date, p.location,
            p.organization_id, o.name AS organization_name
      FROM public.project p
      JOIN public.organization o ON p.organization_id = o.organization_id
      WHERE p.date >= CURRENT_DATE
      ORDER BY p.date ASC
      LIMIT $1;
    `;

    const queryParams = [number_of_projects];
    const result = await db.query(query, queryParams);

    return result.rows;
}

const getProjectDetails = async (id) => {
    const query = `
        SELECT p.project_id, p.title, p.description, p.date, p.location,
            p.organization_id, o.name AS organization_name
      FROM public.project p
      JOIN public.organization o ON p.organization_id = o.organization_id
      WHERE p.project_id = $1;
    `;

    const queryParams = [id];
    const result = await db.query(query, queryParams);

    // Return the first row of the result set, or null if no rows are found
    return result.rows.length > 0 ? result.rows[0] : null;
}

const getProjectsByCategoryId = async (categoryId) => {
    const query = `
        SELECT p.project_id, p.title, p.description, p.date, p.location,
            p.organization_id, o.name AS organization_name
      FROM public.project p
      JOIN public.project_category pc ON p.project_id = pc.project_id
      JOIN public.organization o ON p.organization_id = o.organization_id
      WHERE pc.category_id = $1
      ORDER BY p.date;
    `;

    const queryParams = [categoryId];
    const result = await db.query(query, queryParams);

    return result.rows;
}

/**
 * Creates a new service project in the database.
 * @param {string} title - The title of the project.
 * @param {string} description - A description of the project.
 * @param {string} location - Where the project takes place.
 * @param {string} date - The project date (YYYY-MM-DD).
 * @param {string} organizationId - The id of the organization running the project.
 * @returns {number} The id of the newly created project record.
 */
const createProject = async (title, description, location, date, organizationId) => {
    const query = `
      INSERT INTO project (title, description, location, date, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING project_id;
    `;

    const queryParams = [title, description, location, date, organizationId];
    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        throw new Error('Failed to create project');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new project with ID:', result.rows[0].project_id);
    }

    return result.rows[0].project_id;
}

/**
 * Updates an existing service project in the database.
 * The organization id is part of the update so a project can be moved
 * to a different organization.
 * @param {string} projectId - The id of the project to update.
 * @param {string} title - The new title of the project.
 * @param {string} description - The new description of the project.
 * @param {string} location - The new location of the project.
 * @param {string} date - The new project date (YYYY-MM-DD).
 * @param {string} organizationId - The id of the organization running the project.
 * @returns {number} The id of the updated project record.
 */
const updateProject = async (projectId, title, description, location, date, organizationId) => {
    const query = `
      UPDATE project
      SET title = $1, description = $2, location = $3, date = $4, organization_id = $5
      WHERE project_id = $6
      RETURNING project_id;
    `;

    const queryParams = [title, description, location, date, organizationId, projectId];
    const result = await db.query(query, queryParams);

    // No row was updated, so no project has this ID.
    // Tag the error as a 404 so the global error handler shows the "not found" page
    if (result.rows.length === 0) {
        const err = new Error('Service Project Not Found');
        err.status = 404;
        throw err;
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Updated project with ID:', projectId);
    }

    return result.rows[0].project_id;
}

// Export the model functions
export { getAllProjects, getProjectsByOrganizationId, getUpcomingProjects, getProjectDetails, getProjectsByCategoryId, createProject, updateProject }
