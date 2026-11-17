// Import any needed model functions
import {
    getAllCategories,
    getCategoryDetails,
    getCategoriesByProjectId,
    updateCategoryAssignments
} from '../models/categories.js';
import { getProjectsByCategoryId, getProjectDetails } from '../models/projects.js';

// Define any controller functions
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Project Categories';

    res.render('categories', { title, categories });
};

const showCategoryDetailsPage = async (req, res, next) => {
    const categoryId = req.params.id;
    const category = await getCategoryDetails(categoryId);

    // Send a 404 if no category has this ID
    if (!category) {
        const err = new Error('Category Not Found');
        err.status = 404;
        return next(err);
    }

    const projects = await getProjectsByCategoryId(categoryId);
    const title = 'Category Details';

    res.render('category', { title, category, projects });
};

const showAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;

    const projectDetails = await getProjectDetails(projectId);

    // Send a 404 if no service project has this ID (same as the project details page)
    if (!projectDetails) {
        const err = new Error('Service Project Not Found');
        err.status = 404;
        return next(err);
    }

    const categories = await getAllCategories();
    const assignedCategories = await getCategoriesByProjectId(projectId);

    const title = 'Assign Categories to Project';

    res.render('assign-categories', { title, projectId, projectDetails, categories, assignedCategories });
};

const processAssignCategoriesForm = async (req, res, next) => {
    const projectId = req.params.projectId;

    // Send a 404 if no service project has this ID (same check as the GET route)
    const projectDetails = await getProjectDetails(projectId);
    if (!projectDetails) {
        const err = new Error('Service Project Not Found');
        err.status = 404;
        return next(err);
    }

    // In Express 5, req.body is undefined when a request has no body at all,
    // so use optional chaining (?.) instead of req.body.categoryIds
    const selectedCategoryIds = req.body?.categoryIds || [];

    // Ensure selectedCategoryIds is an array
    // (one checked box arrives as a single string, none arrives as undefined)
    const categoryIdsArray = Array.isArray(selectedCategoryIds) ? selectedCategoryIds : [selectedCategoryIds];

    // Validate BEFORE changing anything: updateCategoryAssignments deletes the old
    // assignments first, so a bad ID that failed during the inserts would leave the
    // project with missing categories. Every ID must belong to a real category.
    const allCategories = await getAllCategories();
    const validCategoryIds = allCategories.map((category) => String(category.category_id));
    const allValid = categoryIdsArray.every((categoryId) => validCategoryIds.includes(categoryId));

    if (!allValid) {
        req.flash('error', 'One or more selected categories are not valid.');
        return res.redirect(`/assign-categories/${projectId}`);
    }

    // Remove duplicates so the same category isn't inserted twice
    const uniqueCategoryIds = [...new Set(categoryIdsArray)];

    await updateCategoryAssignments(projectId, uniqueCategoryIds);
    req.flash('success', 'Categories updated successfully.');
    res.redirect(`/project/${projectId}`);
};

// Export any controller functions
export {
    showCategoriesPage,
    showCategoryDetailsPage,
    showAssignCategoriesForm,
    processAssignCategoriesForm
};
